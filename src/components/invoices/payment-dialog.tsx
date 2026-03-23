"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { recordPayment } from "@/lib/actions/invoices";

interface Props {
  invoiceId: string;
  amountDue: number;
  currency: string;
  onRecorded?: () => void;
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "other", label: "Other" },
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function PaymentDialog({ invoiceId, amountDue, currency, onRecorded }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(amountDue));
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await recordPayment(invoiceId, {
      amount: amountNum,
      method: method || undefined,
      reference: reference || undefined,
      notes: notes || undefined,
      date,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setOpen(false);
    setAmount(String(amountDue));
    setMethod("");
    setReference("");
    setNotes("");
    setSaving(false);
    onRecorded?.();
  };

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <CreditCard className="h-3.5 w-3.5" />
        Record Payment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded">
              {error}
            </div>
          )}

          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="text-lg font-semibold font-mono">{formatCurrency(amountDue, currency)}</p>
          </div>

          <div>
            <Label className="text-xs">Payment Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9"
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={(v: string | null) => { if (v) setMethod(v); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Reference / Transaction ID</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} className="h-9" placeholder="e.g. TXN-12345" />
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-xs" placeholder="Optional notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              Record Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
