"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  MoreHorizontal,
  Download,
  Trash2,
  FolderOpen,
  Upload,
  Search,
  Loader2,
  Pencil,
} from "lucide-react";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { deleteDocument, renameDocument, type DocumentWithVersion } from "@/lib/actions/documents";

interface Props {
  tenantId: string;
  documents: DocumentWithVersion[];
  folders: string[];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-rose-400" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="h-4 w-4 text-blue-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function DocumentList({ tenantId, documents: initial, folders: initialFolders }: Props) {
  const [docs, setDocs] = useState(initial);
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  const allFolders = Array.from(new Set([...folders]));

  const filtered = docs.filter((d) => {
    if (activeFolder && d.folder !== activeFolder) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.currentVersion?.fileName.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  function handleDelete(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    });
  }

  function startRename(doc: DocumentWithVersion) {
    setEditingId(doc.id);
    setEditName(doc.name);
  }

  function handleRename(id: string) {
    startTransition(async () => {
      const res = await renameDocument(id, editName);
      if ("error" in res) return;
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, name: editName.trim() } : d));
      setEditingId(null);
    });
  }

  // Refresh after upload — rely on revalidatePath from server action + Next.js router
  function handleUploadSuccess() {
    setUploadOpen(false);
    // Page will revalidate from server action
  }

  return (
    <div className="flex gap-6">
      {/* Folder sidebar */}
      <aside className="w-44 shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Folders</p>
        <nav className="space-y-0.5">
          <button
            className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
              activeFolder === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
            }`}
            onClick={() => setActiveFolder(null)}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            All files
          </button>
          {allFolders.map((f) => (
            <button
              key={f}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                activeFolder === f ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
              }`}
              onClick={() => setActiveFolder(f)}
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{f === "/" ? "Root" : f}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="border rounded-lg p-10 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "No documents match your search" : "No documents yet"}
            </p>
            {!search && (
              <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Upload your first document
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Folder</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Size</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Uploaded</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon mimeType={doc.currentVersion?.mimeType ?? ""} />
                        <div className="min-w-0">
                          {editingId === doc.id ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-6 text-xs px-1.5 w-40"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(doc.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleRename(doc.id)} disabled={isPending}>
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <p className="font-medium truncate">{doc.name}</p>
                          )}
                          {doc.currentVersion && (
                            <p className="text-xs text-muted-foreground truncate">{doc.currentVersion.fileName}</p>
                          )}
                          {doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {doc.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="h-4 px-1 text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{doc.folder === "/" ? "Root" : doc.folder}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground font-mono">
                        {doc.currentVersion ? formatBytes(doc.currentVersion.fileSize) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>} />
                        <DropdownMenuContent align="end" className="w-40">
                          {doc.currentVersion && (
                            <DropdownMenuItem
                              onClick={() => window.open(doc.currentVersion!.fileUrl, "_blank")}
                            >
                              <Download className="h-3.5 w-3.5 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => startRename(doc)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadDocumentDialog
        tenantId={tenantId}
        folders={allFolders}
        open={uploadOpen}
        onOpenChange={(v) => {
          setUploadOpen(v);
          if (!v) handleUploadSuccess();
        }}
      />
    </div>
  );
}
