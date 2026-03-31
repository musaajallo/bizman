"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2, AlertCircle, MoreHorizontal, Plus, Upload, Zap, Trash2, Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addStatementLine,
  importStatementCSV,
  deleteStatementLine,
  updateLineReason,
  autoMatchStatement,
  unmatchLine,
  postAdjustingEntry,
  confirmReconciliation,
  reopenReconciliation,
} from "@/lib/actions/accounting/bank-reconciliation";

type LineStatus = "unmatched" | "matched" | "adjusting_entry_posted";

interface BankLine {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  amount: number;
  status: string;
  unmatchedReason: string | null;
  matchedJournalEntryLineId: string | null;
  adjustingJournalEntryId: string | null;
  matchedLine: {
    debit: number;
    credit: number;
    description: string | null;
    journalEntry: { date: string; description: string; reference: string | null };
  } | null;
}

interface Summary {
  bankClosing: number;
  depositsInTransit: number;
  outstandingCheques: number;
  adjustedBankBalance: number;
  bookBalance: number;
  difference: number;
  isReconciled: boolean;
  matchedCount: number;
  unmatchedCount: number;
  totalLines: number;
  currency: string;
}

const LINE_STATUS_STYLES: Record<string, string> = {
  matched:                "bg-emerald-500/5",
  adjusting_entry_posted: "bg-blue-500/5",
  unmatched:              "",
};

const REASON_LABELS: Record<string, string> = {
  deposit_in_transit: "Deposit in Transit",
  outstanding_cheque: "Outstanding Cheque",
  bank_error:         "Bank Error",
  bank_fee:           "Bank Fee",
  interest:           "Interest Earned",
  nsf:                "NSF / Returned Cheque",
};

const ADJUSTING_TYPES = ["bank_fee", "interest", "nsf"] as const;
const ADJUSTING_LABELS: Record<string, string> = {
  bank_fee: "Bank Fee",
  interest: "Interest Earned",
  nsf:      "NSF / Returned Cheque",
};

function fmtAmt(n: number, currency: string) {
  return `${currency} ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: Summary }) {
  const { currency } = summary;
  const fmt = (n: number) => fmtAmt(n, currency);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Reconciliation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Bank Closing Balance</p>
            <p className="font-mono font-medium mt-0.5">{fmt(summary.bankClosing)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Adjusted Bank Balance</p>
            <p className="font-mono font-medium mt-0.5">{fmt(summary.adjustedBankBalance)}</p>
            {(summary.depositsInTransit > 0 || summary.outstandingCheques > 0) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                +{fmt(summary.depositsInTransit)} DIT / -{fmt(summary.outstandingCheques)} OC
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Book Balance (GL)</p>
            <p className="font-mono font-medium mt-0.5">{fmt(summary.bookBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Difference</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("font-mono font-medium", summary.isReconciled ? "text-emerald-400" : "text-amber-400")}>
                {fmt(summary.difference)}
              </span>
              {summary.isReconciled
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                : <AlertCircle className="h-4 w-4 text-amber-400" />}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{summary.totalLines} lines</span>
          <span className="text-emerald-400">{summary.matchedCount} matched</span>
          <span className={summary.unmatchedCount > 0 ? "text-amber-400" : ""}>{summary.unmatchedCount} unmatched</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddLineDialog({ statementId, onDone }: { statementId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addStatementLine(statementId, fd);
      setOpen(false);
      onDone();
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />Add Line
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Statement Line</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input name="date" type="date" defaultValue={today} required />
              </div>
              <div className="space-y-2">
                <Label>Amount (+deposit / -withdrawal)</Label>
                <Input name="amount" type="number" step="0.01" placeholder="e.g. 5000 or -1200" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="e.g. Customer payment" required />
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input name="reference" placeholder="Cheque/transfer no." />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Adding…" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CSVImportDialog({ statementId, onDone }: { statementId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      // Show first 5 lines as preview
      const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 5);
      setPreview(lines.join("\n"));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    startTransition(async () => {
      const r = await importStatementCSV(statementId, csvText);
      if (r.success) {
        setResult(`Imported ${r.count} line(s)`);
        setTimeout(() => { setOpen(false); setPreview(null); setCsvText(""); setResult(null); onDone(); }, 1500);
      } else {
        setResult(`Error: ${r.error}`);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Upload className="h-3.5 w-3.5" />Import CSV
      </Button>
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setPreview(null); setCsvText(""); setResult(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Import Bank Statement CSV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: <span className="font-mono text-xs">Date, Description, Amount</span>.
              Also accepts separate <span className="font-mono text-xs">Debit / Credit</span> columns.
            </p>
            <Input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} />
            {preview && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview (first 5 rows):</p>
                <pre className="text-xs overflow-x-auto whitespace-pre">{preview}</pre>
              </div>
            )}
            {result && (
              <p className={cn("text-sm", result.startsWith("Error") ? "text-destructive" : "text-emerald-400")}>
                {result}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={isPending || !csvText}>
              {isPending ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main workbench ─────────────────────────────────────────────────────────────

export function ReconciliationWorkbench({
  statementId,
  bankAccountId,
  lines,
  summary,
  status,
  confirmed,
}: {
  statementId: string;
  bankAccountId: string;
  lines: BankLine[];
  summary: Summary;
  status: string;
  confirmed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unmatched" | "matched" | "adjustments">("all");
  const [autoMatchResult, setAutoMatchResult] = useState<string | null>(null);

  function refresh() { router.refresh(); }

  function handleAutoMatch() {
    startTransition(async () => {
      const r = await autoMatchStatement(statementId);
      setAutoMatchResult(r.error ?? `Matched ${r.matched} line(s)`);
      refresh();
    });
  }

  function handleConfirm() {
    startTransition(async () => {
      await confirmReconciliation(statementId);
      refresh();
    });
  }

  function handleReopen() {
    startTransition(async () => {
      await reopenReconciliation(statementId);
      refresh();
    });
  }

  const filtered = lines.filter((l) => {
    if (filter === "unmatched") return l.status === "unmatched";
    if (filter === "matched") return l.status === "matched";
    if (filter === "adjustments") return l.status === "adjusting_entry_posted";
    return true;
  });

  const { currency } = summary;

  return (
    <div className="space-y-4">
      <SummaryCard summary={summary} />

      {/* Filter tabs + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 border-b border-border">
          {(["all", "unmatched", "matched", "adjustments"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                filter === f
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "unmatched" && summary.unmatchedCount > 0 && (
                <span className="ml-1.5 text-xs bg-amber-500/20 text-amber-400 px-1 rounded">
                  {summary.unmatchedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {!confirmed && (
          <div className="flex items-center gap-2 flex-wrap">
            <AddLineDialog statementId={statementId} onDone={refresh} />
            <CSVImportDialog statementId={statementId} onDone={refresh} />
            <Button size="sm" variant="outline" className="gap-2" onClick={handleAutoMatch} disabled={isPending}>
              <Zap className="h-3.5 w-3.5" />Auto-Match
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isPending || !summary.isReconciled}
              className="gap-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />Confirm Reconciliation
            </Button>
          </div>
        )}
        {confirmed && (
          <Button size="sm" variant="outline" onClick={handleReopen} disabled={isPending}>
            Reopen
          </Button>
        )}
      </div>

      {autoMatchResult && (
        <p className="text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />{autoMatchResult}
        </p>
      )}

      {/* Lines table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Reference</TableHead>
              <TableHead className="text-right w-28">Amount</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead>Matched To</TableHead>
              {!confirmed && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={confirmed ? 6 : 7} className="text-center text-muted-foreground py-10">
                  No lines match this filter.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((l) => (
              <TableRow key={l.id} className={LINE_STATUS_STYLES[l.status as LineStatus] ?? ""}>
                <TableCell className="text-sm text-muted-foreground">{fmtDate(l.date)}</TableCell>
                <TableCell className="text-sm">{l.description}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.reference ?? "—"}</TableCell>
                <TableCell className={cn("text-right font-mono text-sm", l.amount < 0 ? "text-rose-400" : "text-emerald-400")}>
                  {l.amount < 0 ? "−" : "+"}{fmtAmt(l.amount, currency)}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", {
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20": l.status === "matched",
                        "bg-blue-500/10 text-blue-400 border-blue-500/20": l.status === "adjusting_entry_posted",
                        "bg-amber-500/10 text-amber-400 border-amber-500/20": l.status === "unmatched",
                      })}
                    >
                      {l.status === "matched" ? "Matched" : l.status === "adjusting_entry_posted" ? "Adjusted" : "Unmatched"}
                    </Badge>
                    {l.unmatchedReason && (
                      <p className="text-xs text-muted-foreground">{REASON_LABELS[l.unmatchedReason] ?? l.unmatchedReason}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {l.matchedLine ? (
                    <div>
                      <p className="font-medium text-foreground">{l.matchedLine.journalEntry.description}</p>
                      <p>{fmtDate(l.matchedLine.journalEntry.date)}{l.matchedLine.journalEntry.reference ? ` · ${l.matchedLine.journalEntry.reference}` : ""}</p>
                    </div>
                  ) : "—"}
                </TableCell>
                {!confirmed && (
                  <TableCell>
                    <LineMenu
                      line={l}
                      statementId={statementId}
                      onDone={refresh}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LineMenu({ line, statementId, onDone }: { line: BankLine; statementId: string; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [adjustType, setAdjustType] = useState<"bank_fee" | "interest" | "nsf" | null>(null);

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => { await fn(); onDone(); });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />} disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {line.status === "unmatched" && (
            <>
              <DropdownMenuItem className="text-xs font-semibold text-muted-foreground" disabled>Mark as…</DropdownMenuItem>
              {(["deposit_in_transit", "outstanding_cheque", "bank_error"] as const).map((r) => (
                <DropdownMenuItem key={r} className="cursor-pointer" onClick={() => act(() => updateLineReason(line.id, r))}>
                  {REASON_LABELS[r]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs font-semibold text-muted-foreground" disabled>Post Adjusting Entry</DropdownMenuItem>
              {ADJUSTING_TYPES.map((t) => (
                <DropdownMenuItem key={t} className="cursor-pointer" onClick={() => setAdjustType(t)}>
                  {ADJUSTING_LABELS[t]}
                </DropdownMenuItem>
              ))}
              {line.unmatchedReason && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => act(() => updateLineReason(line.id, null))}>
                    Clear Classification
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
          {line.status === "matched" && (
            <DropdownMenuItem className="cursor-pointer" onClick={() => act(() => unmatchLine(line.id))}>
              <Unlink className="h-4 w-4 mr-2" />Unmatch
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => act(() => deleteStatementLine(line.id))}
          >
            <Trash2 className="h-4 w-4 mr-2" />Delete Line
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Adjusting entry confirmation dialog */}
      <Dialog open={!!adjustType} onOpenChange={(o) => { if (!o) setAdjustType(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Post Adjusting Entry</DialogTitle>
          </DialogHeader>
          {adjustType && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This will post a <strong>{ADJUSTING_LABELS[adjustType]}</strong> journal entry for this line.
              </p>
              <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                {adjustType === "bank_fee" && (
                  <>
                    <p>DR 6900 General & Admin Expenses</p>
                    <p>CR 1000 Cash / Bank</p>
                  </>
                )}
                {adjustType === "interest" && (
                  <>
                    <p>DR 1000 Cash / Bank</p>
                    <p>CR 4200 Interest Income</p>
                  </>
                )}
                {adjustType === "nsf" && (
                  <>
                    <p>DR 6900 General & Admin Expenses</p>
                    <p>CR 1000 Cash / Bank</p>
                    <p className="text-muted-foreground">(NSF charge recorded)</p>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustType(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!adjustType) return;
                act(() => postAdjustingEntry(line.id, adjustType));
                setAdjustType(null);
              }}
              disabled={isPending}
            >
              Post Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
