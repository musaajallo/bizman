"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { approveBill, voidBill, deleteBill } from "@/lib/actions/bills";
import { BillPaymentDialog } from "./bill-payment-dialog";
import { CheckCircle, Ban, Trash2, Pencil, CreditCard } from "lucide-react";
import Link from "next/link";

interface Props {
  billId: string;
  status: string;
  amountDue: number;
  currency: string;
}

type Action = "approve" | "void" | "delete";

export function BillActions({ billId, status, amountDue, currency }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<Action | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPay = ["approved", "partially_paid", "overdue"].includes(status);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      let result;
      if (action === "approve") result = await approveBill(billId);
      else if (action === "void") result = await voidBill(billId);
      else if (action === "delete") result = await deleteBill(billId);
      else return;

      if (result && "error" in result) { setError(result.error ?? "Error"); return; }
      setAction(null);
      if (action === "delete") router.push("/africs/accounting/bills");
      else router.refresh();
    });
  }

  const dialogs: Record<Action, { title: string; body: string; btn: string; variant: "default" | "destructive" }> = {
    approve: { title: "Approve Bill",  body: "Mark this bill as approved and ready for payment.",              btn: "Approve", variant: "default" },
    void:    { title: "Void Bill",     body: "This will void the bill. It cannot be reversed.",                btn: "Void",    variant: "destructive" },
    delete:  { title: "Delete Bill",   body: "Permanently delete this draft bill. This cannot be undone.",     btn: "Delete",  variant: "destructive" },
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "draft" && (
          <>
            <Link href={`/africs/accounting/bills/${billId}/edit`}>
              <Button size="sm" variant="outline" className="gap-2"><Pencil className="h-3.5 w-3.5" />Edit</Button>
            </Link>
            <Button size="sm" onClick={() => setAction("approve")} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <CheckCircle className="h-3.5 w-3.5" />Approve
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setAction("delete")}>
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </>
        )}
        {canPay && (
          <>
            <Button size="sm" onClick={() => setPaymentOpen(true)} className="gap-2">
              <CreditCard className="h-3.5 w-3.5" />Record Payment
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setAction("void")}>
              <Ban className="h-3.5 w-3.5" />Void
            </Button>
          </>
        )}
      </div>

      {action && (
        <Dialog open onOpenChange={(o) => { if (!o) setAction(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>{dialogs[action].title}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{dialogs[action].body}</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAction(null)} disabled={isPending}>Cancel</Button>
              <Button variant={dialogs[action].variant} onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Please wait…" : dialogs[action].btn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {paymentOpen && (
        <BillPaymentDialog
          billId={billId}
          amountDue={amountDue}
          currency={currency}
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </>
  );
}
