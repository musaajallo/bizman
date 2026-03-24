"use client";

import { useState, useRef, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { createDocument } from "@/lib/actions/documents";

interface Props {
  tenantId: string;
  folders: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadDocumentDialog({ tenantId, folders, open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("/");
  const [customFolder, setCustomFolder] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = uploading || isPending;

  function reset() {
    setFile(null);
    setName("");
    setFolder("/");
    setCustomFolder("");
    setTags("");
    setDescription("");
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !name) {
      // Auto-fill name from filename (strip extension)
      setName(f.name.replace(/\.[^/.]+$/, "") ?? "");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (!name.trim()) { setError("Name is required"); return; }

    setError(null);
    setUploading(true);

    let fileUrl: string;
    let fileName: string;
    let fileSize: number;
    let mimeType: string;

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      const data = await res.json();
      fileUrl = data.url;
      fileName = data.fileName;
      fileSize = data.fileSize;
      mimeType = data.mimeType;
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }

    setUploading(false);

    const resolvedFolder = folder === "__new__" ? (customFolder.trim() || "/") : folder;

    const formData = new FormData();
    formData.set("tenantId", tenantId);
    formData.set("name", name.trim());
    formData.set("fileUrl", fileUrl);
    formData.set("fileName", fileName);
    formData.set("fileSize", String(fileSize));
    formData.set("mimeType", mimeType);
    formData.set("folder", resolvedFolder);
    formData.set("description", description.trim());
    formData.set("tags", tags);

    startTransition(async () => {
      const res = await createDocument(formData);
      if ("error" in res) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      reset();
      onOpenChange(false);
    });
  }

  const allFolders = Array.from(new Set(["/", ...folders]));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) { if (!v) reset(); onOpenChange(v); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              file ? "border-primary/50 bg-primary/5" : "border-border hover:border-muted-foreground/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="ml-auto p-1 rounded hover:bg-muted"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click or drag to upload</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Document name"
              className="h-9"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Folder</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              disabled={isLoading}
            >
              {allFolders.map((f) => (
                <option key={f} value={f}>{f === "/" ? "Root" : f}</option>
              ))}
              <option value="__new__">+ New folder…</option>
            </select>
            {folder === "__new__" && (
              <Input
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                placeholder="e.g. Contracts"
                className="h-9 mt-1"
                disabled={isLoading}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tags <span className="text-muted-foreground">(comma separated)</span></Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. contract, NDA, signed"
              className="h-9"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="h-9"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onOpenChange(false); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? "Uploading…" : isPending ? "Saving…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
