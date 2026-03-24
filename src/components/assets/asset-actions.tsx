"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deleteAsset } from "@/lib/actions/assets";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Props {
  assetId: string;
  hasActiveAssignment: boolean;
}

export function AssetActions({ assetId, hasActiveAssignment }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAsset(assetId);
      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.push("/africs/accounting/assets");
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href={`/africs/accounting/assets/${assetId}/edit`}>
          <Button size="sm" variant="outline" className="gap-2">
            <Pencil className="h-3.5 w-3.5" />Edit
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-destructive"
          onClick={() => setShowDelete(true)}
          disabled={hasActiveAssignment}
          title={hasActiveAssignment ? "Return the asset before deleting" : undefined}
        >
          <Trash2 className="h-3.5 w-3.5" />Delete
        </Button>
      </div>

      {showDelete && (
        <Dialog open onOpenChange={(o) => { if (!o) { setShowDelete(false); setError(null); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Asset</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete this asset and all related records. This cannot be undone.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDelete(false)} disabled={isPending}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
