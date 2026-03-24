"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitExpense, approveExpense, rejectExpense, markReimbursed, deleteExpense } from "@/lib/actions/expenses";
import { Send, CheckCircle, XCircle, Banknote, Trash2, Pencil } from "lucide-react";
import Link from "next/link";

interface Props {
  expenseId: string;
  status: string;
}

type Action = "submit" | "approve" | "reject" | "reimburse" | "delete";

export function ExpenseActions({ expenseId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<Action | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      let result;
      if (action === "submit") result = await submitExpense(expenseId);
      else if (action === "approve") result = await approveExpense(expenseId);
      else if (action === "reject") result = await rejectExpense(expenseId, rejectNotes);
      else if (action === "reimburse") result = await markReimbursed(expenseId);
      else if (action === "delete") result = await deleteExpense(expenseId);
      else return;

      if (result && "error" in result) {
        setError(result.error ?? "An error occurred");
      } else {
        setAction(null);
        if (action === "delete") router.push("/africs/accounting/expenses");
        else router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "draft" && (
          <>
            <Link href={`/africs/accounting/expenses/${expenseId}/edit`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
            <Button size="sm" onClick={() => setAction("submit")} className="gap-2">
              <Send className="h-3.5 w-3.5" />
              Submit
            </Button>
            <Button
              size="sm" variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setAction("delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
        {status === "submitted" && (
          <>
            <Button
              size="sm"
              onClick={() => setAction("approve")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm" variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => { setRejectNotes(""); setAction("reject"); }}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        )}
        {status === "approved" && (
          <Button
            size="sm"
            onClick={() => setAction("reimburse")}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Banknote className="h-3.5 w-3.5" />
            Mark Reimbursed
          </Button>
        )}
        {status === "rejected" && (
          <Button
            size="sm" variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setAction("delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>

      {action && action !== "reject" && (
        <Dialog open onOpenChange={(open) => { if (!open) setAction(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {action === "submit" ? "Submit Expense" :
                 action === "approve" ? "Approve Expense" :
                 action === "reimburse" ? "Mark as Reimbursed" :
                 "Delete Expense"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {action === "submit" ? "Send this expense for review. You won't be able to edit it after submitting." :
               action === "approve" ? "Approve this expense claim for reimbursement." :
               action === "reimburse" ? "Confirm that this expense has been reimbursed to the employee." :
               "Permanently delete this expense. This cannot be undone."}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAction(null)} disabled={isPending}>Cancel</Button>
              <Button
                variant={action === "delete" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "Please wait…" :
                 action === "submit" ? "Submit" :
                 action === "approve" ? "Approve" :
                 action === "reimburse" ? "Confirm" :
                 "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {action === "reject" && (
        <Dialog open onOpenChange={(open) => { if (!open) setAction(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Reject Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Provide a reason for rejection. This will be visible to the submitter.</p>
              <Textarea
                placeholder="Reason for rejection…"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAction(null)} disabled={isPending}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={isPending || !rejectNotes.trim()}>
                {isPending ? "Please wait…" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
