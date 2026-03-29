"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { addRepayment, deleteRepayment, updateLoanStatus } from "@/lib/actions/loans";

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  disbursed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  settled: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  defaulted: "bg-red-500/10 text-red-400 border-red-500/20",
  written_off: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

interface Repayment {
  id: string; amount: number; method: string; paidAt: string; notes: string | null;
}

interface Loan {
  id: string;
  loanNumber: string;
  loanType: string;
  borrowerName: string;
  principal: number;
  interestRate: number;
  currency: string;
  repaymentSchedule: string;
  repaymentAmount: number | null;
  disbursementDate: string | null;
  status: string;
  payrollDeduction: boolean;
  notes: string | null;
  amountPaid: number;
  outstanding: number;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string } | null;
  repayments: Repayment[];
}

export function LoanDetailCard({ loan }: { loan: Loan }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteRepaymentId, setDeleteRepaymentId] = useState<string | null>(null);
  const [repaymentMethod, setRepaymentMethod] = useState("bank_transfer");

  const progressPct = loan.principal > 0 ? Math.min(Math.round((loan.amountPaid / loan.principal) * 100), 100) : 0;

  function handleAddRepayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("method", repaymentMethod);
    startTransition(async () => {
      await addRepayment(loan.id, fd);
      setAddOpen(false);
      router.refresh();
    });
  }

  function handleDeleteRepayment() {
    if (!deleteRepaymentId) return;
    startTransition(async () => {
      await deleteRepayment(deleteRepaymentId, loan.id);
      setDeleteRepaymentId(null);
      router.refresh();
    });
  }

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateLoanStatus(loan.id, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-0.5">{loan.loanNumber}</p>
              <CardTitle className="text-xl">{loan.borrowerName}</CardTitle>
              {loan.employee && (
                <Link href={`/africs/hr/employees/${loan.employee.id}`} className="text-xs text-primary hover:underline">
                  {loan.employee.employeeNumber}
                </Link>
              )}
            </div>
            <Badge variant="outline" className={`${STATUS_STYLES[loan.status] ?? ""} shrink-0`}>
              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1).replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary figures */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Principal", value: `${loan.currency} ${loan.principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: "Repaid", value: `${loan.currency} ${loan.amountPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: "Outstanding", value: `${loan.currency} ${loan.outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, highlight: loan.outstanding > 0 },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/40 rounded-lg py-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-base font-semibold mt-0.5 ${s.highlight ? "text-amber-400" : ""}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Repayment progress</span><span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { label: "Interest Rate", value: `${loan.interestRate}%` },
              { label: "Schedule", value: loan.repaymentSchedule.replace("_", " ") },
              { label: "Instalment", value: loan.repaymentAmount ? `${loan.currency} ${loan.repaymentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—" },
              { label: "Disbursed", value: loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
              { label: "Payroll Deduction", value: loan.payrollDeduction ? "Yes" : "No" },
            ].map((d) => (
              <div key={d.label} className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium capitalize">{d.value}</span>
              </div>
            ))}
          </div>

          {loan.notes && (
            <p className="text-xs text-muted-foreground bg-secondary/40 rounded-md px-3 py-2">{loan.notes}</p>
          )}

          {/* Status actions */}
          {loan.status === "approved" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("disbursed")} disabled={isPending}>
              Mark as Disbursed
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Repayments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Repayment Log</CardTitle>
            {loan.status !== "settled" && loan.status !== "written_off" && (
              <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />Add Repayment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loan.repayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No repayments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.repayments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {new Date(r.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {r.method.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {loan.currency} {r.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteRepaymentId(r.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add repayment dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Repayment</DialogTitle></DialogHeader>
          <form onSubmit={handleAddRepayment} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rep-amount">Amount <span className="text-destructive">*</span></Label>
              <Input id="rep-amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00"
                defaultValue={loan.repaymentAmount ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={repaymentMethod} onValueChange={(v: string | null) => { if (v) setRepaymentMethod(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="payroll_deduction">Payroll Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rep-date">Payment Date</Label>
              <Input id="rep-date" name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rep-notes">Notes</Label>
              <Textarea id="rep-notes" name="notes" rows={2} placeholder="Optional notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete repayment confirmation */}
      <Dialog open={!!deleteRepaymentId} onOpenChange={(open) => { if (!open) setDeleteRepaymentId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Repayment</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remove this repayment entry?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteRepaymentId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRepayment} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
