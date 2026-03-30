"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type GLLine = {
  id: string;
  date: Date;
  description: string;
  reference: string | null;
  sourceType: string;
  debit: number;
  credit: number;
};

type GLAccount = {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  isContra: boolean;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  lines: GLLine[];
};

type TrialBalance = {
  rows: { code: string; name: string; type: string; debitBalance: number; creditBalance: number }[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
};

const TYPE_STYLES: Record<string, string> = {
  Asset:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Liability:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Equity:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Revenue:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CostOfSales:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Expense:      "bg-orange-500/10 text-orange-400 border-orange-500/20",
  NonOperating: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "CostOfSales", "Expense", "NonOperating"] as const;

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AccountRow({ account }: { account: GLAccount }) {
  const [expanded, setExpanded] = useState(false);
  const hasLines = account.lines.length > 0;

  return (
    <>
      <TableRow
        className={cn(hasLines && "cursor-pointer hover:bg-muted/30")}
        onClick={() => hasLines && setExpanded((v) => !v)}
      >
        <TableCell className="w-6">
          {hasLines
            ? expanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : null}
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">{account.code}</TableCell>
        <TableCell>
          <span className="font-medium text-sm">{account.name}</span>
          {account.isContra && <span className="text-xs text-muted-foreground ml-2">(contra)</span>}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("text-xs", TYPE_STYLES[account.type])}>
            {account.type === "CostOfSales" ? "CoS" : account.type === "NonOperating" ? "Non-Op" : account.type}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-mono text-sm text-muted-foreground">{fmtAmt(account.totalDebit)}</TableCell>
        <TableCell className="text-right font-mono text-sm text-muted-foreground">{fmtAmt(account.totalCredit)}</TableCell>
        <TableCell className="text-right font-mono text-sm font-semibold">
          <span className={cn(account.balance < 0 && "text-rose-400")}>{fmtAmt(Math.abs(account.balance))}</span>
          <span className="text-xs text-muted-foreground ml-1">{account.balance < 0 ? "Cr" : "Dr"}</span>
        </TableCell>
      </TableRow>
      {expanded && account.lines.map((line) => (
        <TableRow key={line.id} className="bg-muted/10">
          <TableCell />
          <TableCell />
          <TableCell className="pl-6">
            <span className="text-sm text-muted-foreground mr-3">{fmt(line.date)}</span>
            <span className="text-sm">{line.description}</span>
            {line.reference && (
              <span className="text-xs font-mono text-muted-foreground ml-2">{line.reference}</span>
            )}
          </TableCell>
          <TableCell />
          <TableCell className="text-right font-mono text-sm">
            {line.debit ? fmtAmt(line.debit) : "—"}
          </TableCell>
          <TableCell className="text-right font-mono text-sm">
            {line.credit ? fmtAmt(line.credit) : "—"}
          </TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

export function GeneralLedgerClient({
  ledger,
  trialBalance,
}: {
  ledger: GLAccount[];
  trialBalance: TrialBalance;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredLedger = ledger.filter((a) => {
    const matchSearch = search === "" ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const filteredTB = trialBalance.rows.filter((r) => {
    const matchSearch = search === "" ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <Tabs defaultValue="ledger">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <TabsList>
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="ledger">
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6"></TableHead>
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="text-right w-32">Total Dr</TableHead>
                <TableHead className="text-right w-32">Total Cr</TableHead>
                <TableHead className="text-right w-36">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLedger.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No accounts with activity found.
                  </TableCell>
                </TableRow>
              )}
              {filteredLedger.map((a) => <AccountRow key={a.id} account={a} />)}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="trial-balance">
        <div className="space-y-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-md border text-sm",
            trialBalance.balanced
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/5 border-rose-500/20 text-rose-400"
          )}>
            {trialBalance.balanced
              ? <><CheckCircle className="h-4 w-4" /> Balanced — debits equal credits</>
              : <><XCircle className="h-4 w-4" /> Unbalanced — check for posting errors</>}
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right w-36">Debit</TableHead>
                  <TableHead className="text-right w-36">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTB.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      No balances to display.
                    </TableCell>
                  </TableRow>
                )}
                {filteredTB.map((r) => (
                  <TableRow key={r.code}>
                    <TableCell className="font-mono text-sm font-medium">{r.code}</TableCell>
                    <TableCell className="text-sm">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", TYPE_STYLES[r.type])}>
                        {r.type === "CostOfSales" ? "CoS" : r.type === "NonOperating" ? "Non-Op" : r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.debitBalance ? fmtAmt(r.debitBalance) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.creditBalance ? fmtAmt(r.creditBalance) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTB.length > 0 && (
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell colSpan={3} className="text-sm">Totals</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmtAmt(trialBalance.totalDebits)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmtAmt(trialBalance.totalCredits)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
