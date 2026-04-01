"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type JournalLine = {
  id: string;
  debit: unknown;
  credit: unknown;
  description: string | null;
  account: { code: string; name: string; type: string };
};

type JournalEntry = {
  id: string;
  date: Date | string;
  description: string;
  reference: string | null;
  sourceType: string;
  sourceId?: string | null;
  period: { name: string } | null;
  lines: JournalLine[];
};

type Period = {
  id: string;
  name: string;
  status?: string;
};

const SOURCE_LABELS: Record<string, string> = {
  invoice:         "Invoice",
  invoice_payment: "Invoice Payment",
  bill:            "Bill",
  bill_payment:    "Bill Payment",
  expense:         "Expense",
  payroll_run:     "Payroll",
  payroll_payment: "Payroll Payment",
  loan:            "Loan",
  loan_repayment:  "Loan Repayment",
  manual:          "Manual",
};

const SOURCE_STYLES: Record<string, string> = {
  invoice:         "bg-blue-500/10 text-blue-400 border-blue-500/20",
  invoice_payment: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  bill:            "bg-rose-500/10 text-rose-400 border-rose-500/20",
  bill_payment:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  expense:         "bg-orange-500/10 text-orange-400 border-orange-500/20",
  payroll_run:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
  payroll_payment: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  loan:            "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  loan_repayment:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  manual:          "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function fmt(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmt(val: unknown): string {
  const n = Number(val);
  if (!n) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);
  const total = entry.lines.reduce((s, l) => s + Number(l.debit), 0);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell className="w-6">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{fmt(entry.date)}</TableCell>
        <TableCell className="font-medium text-sm">{entry.description}</TableCell>
        <TableCell>
          {entry.reference && (
            <span className="text-xs font-mono text-muted-foreground">{entry.reference}</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("text-xs", SOURCE_STYLES[entry.sourceType])}>
            {SOURCE_LABELS[entry.sourceType] ?? entry.sourceType}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">{entry.period?.name ?? "—"}</TableCell>
        <TableCell className="text-right font-mono text-sm">
          {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </TableCell>
      </TableRow>
      {expanded && entry.lines.map((line) => (
        <TableRow key={line.id} className="bg-muted/10">
          <TableCell />
          <TableCell />
          <TableCell className="pl-8">
            <span className="font-mono text-xs text-muted-foreground mr-2">{line.account.code}</span>
            <span className="text-sm">{line.account.name}</span>
            {line.description && line.description !== entry.description && (
              <span className="text-xs text-muted-foreground ml-2">— {line.description}</span>
            )}
          </TableCell>
          <TableCell />
          <TableCell />
          <TableCell />
          <TableCell>
            <div className="flex justify-end gap-8 font-mono text-sm">
              <span className={cn(Number(line.debit)  ? "text-foreground" : "text-muted-foreground")}>
                {fmtAmt(line.debit)}
              </span>
              <span className={cn(Number(line.credit) ? "text-foreground" : "text-muted-foreground")}>
                {fmtAmt(line.credit)}
              </span>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function JournalEntriesClient({
  entries,
  periods,
}: {
  entries: JournalEntry[];
  periods: Period[];
}) {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filtered = entries.filter((e) => {
    const matchSearch = search === "" ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.reference ?? "").toLowerCase().includes(search.toLowerCase());
    const matchPeriod = periodFilter === "all" || (e.period?.name === periods.find(p => p.id === periodFilter)?.name);
    const matchSource = sourceFilter === "all" || e.sourceType === sourceFilter;
    return matchSearch && matchPeriod && matchSource;
  });

  const sourceTypes = [...new Set(entries.map((e) => e.sourceType))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search description or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={periodFilter} onValueChange={(v) => { if (v) setPeriodFilter(v); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All periods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All periods</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { if (v) setSourceFilter(v); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sourceTypes.map((s) => (
              <SelectItem key={s} value={s}>{SOURCE_LABELS[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6"></TableHead>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32">Reference</TableHead>
              <TableHead className="w-36">Source</TableHead>
              <TableHead className="w-32">Period</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No journal entries found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((e) => <EntryRow key={e.id} entry={e} />)}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
