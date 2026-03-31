"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createStatement } from "@/lib/actions/accounting/bank-reconciliation";

interface Period { id: string; name: string; }
interface Statement {
  id: string;
  periodId: string;
  periodName: string;
  openingBalance: number;
  closingBalance: number;
  status: string;
  lineCount: number;
  confirmedAt: string | null;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft:       "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reconciled:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function BankStatementsClient({
  bankAccountId,
  currency,
  statements,
  periods,
}: {
  bankAccountId: string;
  currency: string;
  statements: Statement[];
  periods: Period[];
}) {
  const [open, setOpen] = useState(false);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function handleCreate() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("periodId", periodId);
      fd.set("openingBalance", openingBalance);
      fd.set("closingBalance", closingBalance);
      const result = await createStatement(bankAccountId, fd);
      if (result.success) {
        setOpen(false);
        router.push(`/africs/accounting/bank-reconciliation/${bankAccountId}/${result.id}`);
      }
    });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />New Statement
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Closing Balance</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No statements yet. Create one to start reconciling.
                </TableCell>
              </TableRow>
            )}
            {statements.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.periodName}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(s.openingBalance)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(s.closingBalance)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.lineCount} lines</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-xs ${STATUS_STYLES[s.status] ?? ""}`}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1).replace("_", " ")}
                    </Badge>
                    {s.status === "confirmed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/africs/accounting/bank-reconciliation/${bankAccountId}/${s.id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Bank Statement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={periodId} onValueChange={(v) => v && setPeriodId(v)}>
                <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                <SelectContent>
                  {periods.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Closing Balance</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending || !periodId}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
