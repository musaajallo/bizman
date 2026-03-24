"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveTimesheet, rejectTimesheet, reopenTimesheet, deleteTimesheet } from "@/lib/actions/timesheets";
import { CheckCircle, XCircle, RotateCcw, Trash2, Send } from "lucide-react";
import Link from "next/link";

interface Props {
  timesheetId: string;
  status: string;
}

type Action = "approve" | "reject" | "reopen" | "delete";

export function TimesheetActions({ timesheetId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<Action | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      let result;
      if (action === "approve") result = await approveTimesheet(timesheetId, notes || undefined);
      else if (action === "reject") result = await rejectTimesheet(timesheetId, notes);
      else if (action === "reopen") result = await reopenTimesheet(timesheetId);
      else if (action === "delete") result = await deleteTimesheet(timesheetId);
      else return;

      if (result && "error" in result) { setError(result.error ?? "Error"); return; }
      setAction(null);
      setNotes("");
      if (action === "delete") router.push("/africs/hr/timesheets");
      else router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {status === "draft" && (
          <>
            <Link href={`/africs/hr/timesheets/${timesheetId}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setAction("delete")}>
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </>
        )}
        {status === "submitted" && (
          <>
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAction("approve")}>
              <CheckCircle className="h-3.5 w-3.5" />Approve
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setAction("reject")}>
              <XCircle className="h-3.5 w-3.5" />Reject
            </Button>
          </>
        )}
        {status === "rejected" && (
          <>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setAction("reopen")}>
              <RotateCcw className="h-3.5 w-3.5" />Reopen
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setAction("delete")}>
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </>
        )}
        {status === "approved" && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />Approved
          </span>
        )}
      </div>

      {action && (
        <Dialog open onOpenChange={(o) => { if (!o) { setAction(null); setNotes(""); setError(null); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {action === "approve" ? "Approve Timesheet" :
                 action === "reject"  ? "Reject Timesheet" :
                 action === "reopen"  ? "Reopen Timesheet" :
                 "Delete Timesheet"}
              </DialogTitle>
            </DialogHeader>

            {(action === "approve" || action === "reject") && (
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {action === "reject" ? "Rejection reason *" : "Notes (optional)"}
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === "reject" ? "Explain why this timesheet is being rejected…" : "Optional reviewer notes…"}
                />
              </div>
            )}
            {action === "reopen" && (
              <p className="text-sm text-muted-foreground">This will reset the timesheet to draft so the employee can edit and resubmit.</p>
            )}
            {action === "delete" && (
              <p className="text-sm text-muted-foreground">This will permanently delete the timesheet and all its entries. This cannot be undone.</p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="ghost" onClick={() => { setAction(null); setNotes(""); }} disabled={isPending}>Cancel</Button>
              <Button
                variant={action === "delete" || action === "reject" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "Please wait…" :
                 action === "approve" ? "Approve" :
                 action === "reject"  ? "Reject" :
                 action === "reopen"  ? "Reopen" :
                 "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
