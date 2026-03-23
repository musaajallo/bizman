"use client";

import { useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addEmployeeDocument, deleteEmployeeDocument } from "@/lib/actions/employees";
import { FileText, Trash2, Upload, Download } from "lucide-react";

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedAt: Date | string;
}

export function EmployeeDocumentList({ employeeId, documents }: { employeeId: string; documents: Document[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const fd = new FormData();
      fd.set("employeeId", employeeId);
      fd.set("name", file.name);
      fd.set("fileUrl", reader.result as string);
      fd.set("mimeType", file.type);
      fd.set("fileSize", String(file.size));
      startTransition(() => { void addEmployeeDocument(fd); });
    };
    reader.readAsDataURL(file);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    startTransition(() => { void deleteEmployeeDocument(id, employeeId); });
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">Documents</CardTitle>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={pending}>
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No documents uploaded yet
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-2.5">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={doc.fileUrl} download={doc.name}>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
