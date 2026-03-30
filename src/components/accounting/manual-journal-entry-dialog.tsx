"use client";

import { useState, useTransition, useId } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { createManualJournalEntry } from "@/lib/actions/accounting/journal";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Line {
  key: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

const ACCOUNT_TYPE_ORDER = ["Asset", "Liability", "Equity", "Revenue", "CostOfSales", "Expense", "NonOperating"];

function groupAccounts(accounts: Account[]) {
  const groups: Record<string, Account[]> = {};
  for (const a of accounts) {
    if (!groups[a.type]) groups[a.type] = [];
    groups[a.type].push(a);
  }
  return ACCOUNT_TYPE_ORDER.filter((t) => groups[t]?.length).map((t) => ({
    type: t,
    accounts: groups[t],
  }));
}

export function ManualJournalEntryDialog({ accounts }: { accounts: Account[] }) {
  const uid = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const makeKey = () => `${Date.now()}-${Math.random()}`;
  const [lines, setLines] = useState<Line[]>([
    { key: makeKey(), accountId: "", debit: "", credit: "", description: "" },
    { key: makeKey(), accountId: "", debit: "", credit: "", description: "" },
  ]);

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;
  const fmt = (n: number) => n > 0 ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  function updateLine(key: string, field: keyof Line, value: string) {
    setLines((prev) => prev.map((l) => l.key === key ? { ...l, [field]: value } : l));
  }

  function addLine() {
    setLines((prev) => [...prev, { key: makeKey(), accountId: "", debit: "", credit: "", description: "" }]);
  }

  function removeLine(key: string) {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function handleDebitChange(key: string, value: string) {
    setLines((prev) => prev.map((l) =>
      l.key === key ? { ...l, debit: value, credit: value ? "" : l.credit } : l
    ));
  }

  function handleCreditChange(key: string, value: string) {
    setLines((prev) => prev.map((l) =>
      l.key === key ? { ...l, credit: value, debit: value ? "" : l.debit } : l
    ));
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setDate(today);
    setDescription("");
    setReference("");
    setLines([
      { key: makeKey(), accountId: "", debit: "", credit: "", description: "" },
      { key: makeKey(), accountId: "", debit: "", credit: "", description: "" },
    ]);
  }

  function handleSubmit() {
    setError(null);
    if (!description.trim()) { setError("Description is required"); return; }
    const hasEmpty = lines.some((l) => !l.accountId);
    if (hasEmpty) { setError("All lines need an account selected"); return; }
    if (!isBalanced) { setError("Entry must balance: total debits must equal total credits"); return; }

    startTransition(async () => {
      const result = await createManualJournalEntry({
        date,
        description: description.trim(),
        reference: reference.trim() || undefined,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description.trim() || undefined,
        })),
      });

      if (result.error) {
        setError(result.error);
      } else {
        handleClose();
        router.refresh();
      }
    });
  }

  const grouped = groupAccounts(accounts);

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />New Manual Entry
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              New Manual Journal Entry
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header fields */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-date`}>Date</Label>
                <Input id={`${uid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor={`${uid}-desc`}>Description <span className="text-destructive">*</span></Label>
                <Input
                  id={`${uid}-desc`}
                  placeholder="e.g. Accrued rent expense for March"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-ref`}>Reference (optional)</Label>
                <Input
                  id={`${uid}-ref`}
                  placeholder="e.g. MJE-001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            {/* Lines */}
            <div className="rounded-md border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_20ch_20ch_20ch_auto] gap-0 text-xs text-muted-foreground font-medium bg-muted/40 border-b border-border px-3 py-2">
                <span>Account</span>
                <span className="text-right pr-3">Debit</span>
                <span className="text-right pr-3">Credit</span>
                <span>Line Description</span>
                <span />
              </div>

              {lines.map((line, idx) => (
                <div
                  key={line.key}
                  className={cn(
                    "grid grid-cols-[1fr_20ch_20ch_20ch_auto] gap-0 items-center border-b border-border last:border-0 px-3 py-2",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                  )}
                >
                  <div className="pr-2">
                    <Select
                      value={line.accountId}
                      onValueChange={(v) => v && updateLine(line.key, "accountId", v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select account…" />
                      </SelectTrigger>
                      <SelectContent>
                        {grouped.map((g) => (
                          <div key={g.type}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {g.type}
                            </div>
                            {g.accounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                <span className="font-mono text-xs mr-2 text-muted-foreground">{a.code}</span>
                                {a.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pr-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-right font-mono text-sm"
                      value={line.debit}
                      onChange={(e) => handleDebitChange(line.key, e.target.value)}
                    />
                  </div>

                  <div className="pr-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-right font-mono text-sm"
                      value={line.credit}
                      onChange={(e) => handleCreditChange(line.key, e.target.value)}
                    />
                  </div>

                  <div className="pr-2">
                    <Input
                      placeholder="Optional note"
                      className="h-8 text-sm"
                      value={line.description}
                      onChange={(e) => updateLine(line.key, "description", e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length <= 2}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Totals row */}
              <div className="grid grid-cols-[1fr_20ch_20ch_20ch_auto] gap-0 bg-muted/40 border-t border-border px-3 py-2 text-sm font-medium">
                <span className="text-muted-foreground">Totals</span>
                <span className={cn("text-right pr-3 font-mono", isBalanced ? "text-emerald-400" : "text-foreground")}>
                  {fmt(totalDebit)}
                </span>
                <span className={cn("text-right pr-3 font-mono", isBalanced ? "text-emerald-400" : "text-foreground")}>
                  {fmt(totalCredit)}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  {totalDebit > 0 && (
                    isBalanced
                      ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Balanced</span></>
                      : <><AlertCircle className="h-3.5 w-3.5 text-amber-400" /><span className="text-amber-400">Unbalanced</span></>
                  )}
                </span>
                <span />
              </div>
            </div>

            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" />Add Line
            </Button>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending || !isBalanced}>
              {isPending ? "Posting…" : "Post Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
