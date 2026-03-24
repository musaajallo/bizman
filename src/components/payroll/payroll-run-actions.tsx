"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { processPayrollRun, markPayrollPaid, deletePayrollRun } from "@/lib/actions/payroll";
import { CheckCircle, DollarSign, Trash2 } from "lucide-react";

interface Props {
  runId: string;
  status: string;
}

export function PayrollRunActions({ runId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<"process" | "pay" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      let result;
      if (confirmAction === "process") result = await processPayrollRun(runId);
      else if (confirmAction === "pay") result = await markPayrollPaid(runId);
      else if (confirmAction === "delete") result = await deletePayrollRun(runId);
      else return;

      if (result && "error" in result) {
        setError(result.error ?? "An error occurred");
      } else {
        setConfirmAction(null);
        if (confirmAction === "delete") router.push("/africs/accounting/payroll");
        else router.refresh();
      }
    });
  }

  const dialogs: Record<string, { title: string; body: string; btn: string; variant: "default" | "destructive" }> = {
    process: {
      title: "Process Payroll Run",
      body: "This will lock all payslips. You will no longer be able to edit individual payslip amounts. Continue?",
      btn: "Process",
      variant: "default",
    },
    pay: {
      title: "Mark as Paid",
      body: "Confirm that all salaries have been disbursed to employee bank accounts.",
      btn: "Mark Paid",
      variant: "default",
    },
    delete: {
      title: "Delete Payroll Run",
      body: "This will permanently delete this payroll run and all its payslips. This cannot be undone.",
      btn: "Delete",
      variant: "destructive",
    },
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "draft" && (
          <>
            <Button
              size="sm"
              onClick={() => setConfirmAction("process")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Process
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setConfirmAction("delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
        {status === "processing" && (
          <Button
            size="sm"
            onClick={() => setConfirmAction("pay")}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Mark as Paid
          </Button>
        )}
      </div>

      {confirmAction && (
        <Dialog open onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{dialogs[confirmAction].title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{dialogs[confirmAction].body}</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={isPending}>Cancel</Button>
              <Button
                variant={dialogs[confirmAction].variant}
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "Please wait…" : dialogs[confirmAction].btn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
