"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitRequisition, reviewRequisition, cancelRequisition } from "@/lib/actions/procurement";
import { CheckCircle, XCircle, SendHorizonal, Ban, Pencil } from "lucide-react";
import Link from "next/link";

interface Props {
  requisitionId: string;
  status: string;
}

type DialogType = "submit" | "approve" | "reject" | "cancel";

export function RequisitionActions({ requisitionId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogType | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAction() {
    setError(null);
    startTransition(async () => {
      let result;
      if (dialog === "submit") {
        result = await submitRequisition(requisitionId);
      } else if (dialog === "approve" || dialog === "reject") {
        result = await reviewRequisition(
          requisitionId,
          dialog === "approve" ? "approved" : "rejected",
          reviewNote || undefined,
        );
      } else if (dialog === "cancel") {
        result = await cancelRequisition(requisitionId);
      } else return;

      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      setDialog(null);
      router.refresh();
    });
  }

  const dialogConfig: Record<DialogType, { title: string; body: string; btn: string; variant: "default" | "destructive" }> = {
    submit:  { title: "Submit for Approval", body: "Send this requisition for manager approval.", btn: "Submit", variant: "default" },
    approve: { title: "Approve Requisition",  body: "Approve and allow this requisition to be converted to a PO.", btn: "Approve", variant: "default" },
    reject:  { title: "Reject Requisition",   body: "Reject this requisition. Add a note explaining why.", btn: "Reject", variant: "destructive" },
    cancel:  { title: "Cancel Requisition",   body: "Cancel this requisition. This cannot be undone.", btn: "Cancel", variant: "destructive" },
  };

  const showNote = dialog === "approve" || dialog === "reject";

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "draft" && (
          <>
            <Link href={`/africs/accounting/procurement/requisitions/${requisitionId}/edit`}>
              <Button size="sm" variant="outline" className="gap-2"><Pencil className="h-3.5 w-3.5" />Edit</Button>
            </Link>
            <Button size="sm" onClick={() => setDialog("submit")} className="gap-2">
              <SendHorizonal className="h-3.5 w-3.5" />Submit for Approval
            </Button>
          </>
        )}
        {status === "pending_approval" && (
          <>
            <Button size="sm" onClick={() => setDialog("approve")} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="h-3.5 w-3.5" />Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("reject")} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
              <XCircle className="h-3.5 w-3.5" />Reject
            </Button>
          </>
        )}
        {["draft", "pending_approval"].includes(status) && (
          <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")} className="gap-2 text-muted-foreground hover:text-destructive">
            <Ban className="h-3.5 w-3.5" />Cancel
          </Button>
        )}
      </div>

      {dialog && (
        <Dialog open onOpenChange={(o) => { if (!o) { setDialog(null); setReviewNote(""); setError(null); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>{dialogConfig[dialog].title}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{dialogConfig[dialog].body}</p>
            {showNote && (
              <div className="space-y-1.5">
                <Label>Note {dialog === "reject" ? "*" : "(optional)"}</Label>
                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3} />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setDialog(null); setReviewNote(""); }} disabled={isPending}>Back</Button>
              <Button
                variant={dialogConfig[dialog].variant}
                onClick={handleAction}
                disabled={isPending || (dialog === "reject" && !reviewNote.trim())}
              >
                {isPending ? "Please wait…" : dialogConfig[dialog].btn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
