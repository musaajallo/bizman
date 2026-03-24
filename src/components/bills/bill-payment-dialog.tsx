"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordBillPayment } from "@/lib/actions/bills";
import { BILL_PAYMENT_METHODS } from "@/lib/bill-constants";
import { CreditCard } from "lucide-react";

interface Props {
  billId: string;
  amountDue: number;
  currency: string;
  open: boolean;
  onClose: () => void;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function BillPaymentDialog({ billId, amountDue, currency, open, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(amountDue));
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function onMethodChange(v: string | null) { if (v) setMethod(v); }

  function handleSubmit() {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { setError("Enter a valid amount"); return; }
    setError(null);
    startTransition(async () => {
      const result = await recordBillPayment(billId, {
        amount: amountNum,
        paymentDate: date,
        paymentMethod: method || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      if (result && "error" in result) { setError(result.error ?? "Error"); return; }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="text-lg font-semibold font-mono">{fmt(amountDue, currency)}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label>Payment Amount <span className="text-destructive">*</span></Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={onMethodChange}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {BILL_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reference / Transaction ID</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN-12345" />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes…" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isPending}>
              <CreditCard className="h-3.5 w-3.5" />
              {isPending ? "Recording…" : "Record Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
