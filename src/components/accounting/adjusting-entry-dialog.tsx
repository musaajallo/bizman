"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { createAdjustingEntry, ADJUSTMENT_TYPE_LABELS, type AdjustmentType } from "@/lib/actions/accounting/adjusting-entries";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: Account[];
}

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "CostOfSales", "Expense", "NonOperating"];

function groupAccounts(accounts: Account[]) {
  return ACCOUNT_TYPES.map((type) => ({
    type,
    accounts: accounts.filter((a) => a.type === type).sort((a, b) => a.code.localeCompare(b.code)),
  })).filter((g) => g.accounts.length > 0);
}

export function AdjustingEntryDialog({ open, onOpenChange, accounts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType]               = useState<AdjustmentType>("accrued_expense");
  const [debitId, setDebitId]         = useState("");
  const [creditId, setCreditId]       = useState("");
  const [isReversing, setIsReversing] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const groups = groupAccounts(accounts);

  function AccountSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
      <Select value={value} onValueChange={(v: string | null) => { if (v) onChange(v); }}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder={`Select ${label} account`} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {groups.map((g) => (
            <div key={g.type}>
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">{g.type}</p>
              {g.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="font-mono text-xs mr-2 text-muted-foreground">{a.code}</span>{a.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd    = new FormData(e.currentTarget);
    const date  = fd.get("date") as string;
    const desc  = fd.get("description") as string;
    const ref   = fd.get("reference") as string;
    const amount = parseFloat(fd.get("amount") as string);

    if (!debitId || !creditId) { setError("Select both debit and credit accounts"); return; }
    if (isNaN(amount) || amount <= 0) { setError("Enter a valid amount"); return; }

    startTransition(async () => {
      const result = await createAdjustingEntry({
        date, description: desc, reference: ref || undefined,
        type, debitAccountId: debitId, creditAccountId: creditId,
        amount, isReversing,
      });
      if (result.error) { setError(result.error); return; }
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Adjusting Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v: string | null) => { if (v) setType(v as AdjustmentType); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input name="description" className="h-9 text-sm" placeholder="e.g. Accrue December salaries" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Reference (optional)</Label>
              <Input name="reference" className="h-9 text-sm" placeholder="e.g. ADJ-001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" className="h-9 text-sm" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Debit Account</Label>
            <AccountSelect value={debitId} onChange={setDebitId} label="debit" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Credit Account</Label>
            <AccountSelect value={creditId} onChange={setCreditId} label="credit" />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Create reversing entry</p>
              <p className="text-xs text-muted-foreground">Auto-post mirror entry on first day of next open period</p>
            </div>
            <Switch checked={isReversing} onCheckedChange={setIsReversing} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Posting…" : "Post Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
