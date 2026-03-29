"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setMilestonePayment } from "@/lib/actions/milestones";

const CURRENCIES = ["USD", "EUR", "GBP", "ZAR", "NGN", "KES", "GHS", "UGX", "TZS", "RWF", "XOF", "XAF"];

interface Props {
  milestoneId: string;
  milestoneName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: {
    amount: { toString(): string } | number | string;
    currency: string;
    description: string | null;
    triggerType: string;
  } | null;
  onSaved: () => void;
}

export function MilestonePaymentDialog({
  milestoneId,
  milestoneName,
  open,
  onOpenChange,
  existing,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState(existing ? existing.amount.toString() : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [triggerType, setTriggerType] = useState(existing?.triggerType ?? "manual");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    setSaving(true);
    await setMilestonePayment(milestoneId, {
      amount: parsed,
      currency,
      description: description || undefined,
      triggerType,
    });
    setSaving(false);
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Payment Trigger</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          For milestone: <span className="font-medium text-foreground">{milestoneName}</span>
        </p>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v: string | null) => { if (v) setCurrency(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Invoice Line Item Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Defaults to "${milestoneName}"`}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Trigger</Label>
            <Select value={triggerType} onValueChange={(v: string | null) => { if (v) setTriggerType(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual — I'll trigger it myself</SelectItem>
                <SelectItem value="on_completion">Auto — trigger when milestone is completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !amount || parseFloat(amount) <= 0}>
            {saving ? "Saving..." : "Save Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
