"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { sendPurchaseOrder, cancelPurchaseOrder, convertPoToBill } from "@/lib/actions/procurement";
import { Send, Ban, Pencil, Receipt } from "lucide-react";
import Link from "next/link";

interface Props {
  orderId: string;
  status: string;
}

type ActionType = "send" | "cancel" | "bill";

export function PoActions({ orderId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      let result;
      if (action === "send") result = await sendPurchaseOrder(orderId);
      else if (action === "cancel") result = await cancelPurchaseOrder(orderId);
      else if (action === "bill") result = await convertPoToBill(orderId);
      else return;

      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      setAction(null);
      router.refresh();
    });
  }

  const dialogs: Record<ActionType, { title: string; body: string; btn: string; variant: "default" | "destructive" }> = {
    send:   { title: "Send Purchase Order", body: "Mark this PO as sent to the vendor.", btn: "Send", variant: "default" },
    cancel: { title: "Cancel Order",        body: "Cancel this purchase order. This cannot be undone.", btn: "Cancel Order", variant: "destructive" },
    bill:   { title: "Create Bill",          body: "Create a supplier bill from this purchase order. The bill will be added to your bills list.", btn: "Create Bill", variant: "default" },
  };

  const canEdit = status === "draft";
  const canSend = status === "draft";
  const canReceive = ["sent", "partially_received"].includes(status);
  const canBill = status === "received";
  const canCancel = ["draft", "sent"].includes(status);

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Link href={`/africs/accounting/procurement/orders/${orderId}/edit`}>
            <Button size="sm" variant="outline" className="gap-2"><Pencil className="h-3.5 w-3.5" />Edit</Button>
          </Link>
        )}
        {canSend && (
          <Button size="sm" onClick={() => setAction("send")} className="gap-2">
            <Send className="h-3.5 w-3.5" />Send to Vendor
          </Button>
        )}
        {canReceive && (
          <Link href={`/africs/accounting/procurement/orders/${orderId}/receive`}>
            <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Receipt className="h-3.5 w-3.5" />Receive Goods
            </Button>
          </Link>
        )}
        {canBill && (
          <Button size="sm" onClick={() => setAction("bill")} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Receipt className="h-3.5 w-3.5" />Create Bill
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="ghost" onClick={() => setAction("cancel")} className="gap-2 text-muted-foreground hover:text-destructive">
            <Ban className="h-3.5 w-3.5" />Cancel
          </Button>
        )}
      </div>

      {action && (
        <Dialog open onOpenChange={(o) => { if (!o) { setAction(null); setError(null); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>{dialogs[action].title}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{dialogs[action].body}</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAction(null)} disabled={isPending}>Back</Button>
              <Button variant={dialogs[action].variant} onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Please wait…" : dialogs[action].btn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
