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
import { Trash2, Plus, CheckCircle, XCircle, CheckCheck } from "lucide-react";
import Link from "next/link";
import { addRepayment, deleteRepayment, updateLoanStatus, approveLoan, rejectLoan } from "@/lib/actions/loans";

const STATUS_STYLES: Record<string, string> = {
  applied:    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  approved:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rejected:   "bg-red-500/10 text-red-400 border-red-500/20",
  disbursed:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  settled:    "bg-teal-500/10 text-teal-400 border-teal-500/20",
  defaulted:  "bg-red-500/10 text-red-400 border-red-500/20",
  written_off:"bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

interface Repayment {
  id: string; amount: number; method: string; paidAt: string; notes: string | null;
}

interface Loan {
  id: string;
  loanNumber: string;
  loanType: string;
  borrowerName: string;
  purpose: string | null;
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
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedByName: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string } | null;
  repayments: Repayment[];
}

interface Props {
  loan: Loan;
  /** Name of the currently logged-in user — used as approver name */
  currentUserName: string;
  /** Whether the current user is allowed to approve/reject */
  canApprove: boolean;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function LoanDetailCard({ loan, currentUserName, canApprove }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteRepaymentId, setDeleteRepaymentId] = useState<string | null>(null);
  const [repaymentMethod, setRepaymentMethod] = useState("bank_transfer");
  const [rejectionReason, setRejectionReason] = useState("");

  const progressPct = loan.principal > 0
    ? Math.min(Math.round((loan.amountPaid / loan.principal) * 100), 100)
    : 0;

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

  function handleApprove() {
    startTransition(async () => {
      await approveLoan(loan.id, currentUserName);
      router.refresh();
    });
  }

  function handleReject() {
    if (!rejectionReason.trim()) return;
    startTransition(async () => {
      await rejectLoan(loan.id, currentUserName, rejectionReason);
      setRejectOpen(false);
      setRejectionReason("");
      router.refresh();
    });
  }

  const canAddRepayment = !["settled", "written_off", "rejected", "applied"].includes(loan.status);

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
          {/* Pending approval banner */}
          {loan.status === "applied" && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm font-medium text-amber-400 mb-1">Pending Approval</p>
              <p className="text-xs text-muted-foreground mb-3">
                This application is awaiting review. {canApprove ? "You can approve or reject it below." : "An approver will review it shortly."}
              </p>
              {canApprove && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleApprove}
                    disabled={isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10"
                    onClick={() => setRejectOpen(true)}
                    disabled={isPending}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Approved/Rejected metadata */}
          {loan.status !== "applied" && loan.approvedByName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-500/5 border border-emerald-500/20 rounded-md px-3 py-2">
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Approved by <span className="font-medium text-foreground">{loan.approvedByName}</span> on {fmtDate(loan.approvedAt)}</span>
            </div>
          )}
          {loan.status === "rejected" && loan.rejectedByName && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 space-y-1">
              <p className="text-xs text-red-400 font-medium">
                Rejected by {loan.rejectedByName} on {fmtDate(loan.rejectedAt)}
              </p>
              {loan.rejectionReason && (
                <p className="text-xs text-muted-foreground">{loan.rejectionReason}</p>
              )}
            </div>
          )}

          {/* Purpose */}
          {loan.purpose && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Purpose</p>
              <p className="text-sm bg-secondary/40 rounded-md px-3 py-2">{loan.purpose}</p>
            </div>
          )}

          {/* Summary figures — hide if just applied/rejected */}
          {!["applied", "rejected"].includes(loan.status) && (
            <>
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

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Repayment progress</span><span>{progressPct}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </>
          )}

          {/* Show principal for applied loans too */}
          {loan.status === "applied" && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/40 rounded-lg py-3 text-center">
                <p className="text-xs text-muted-foreground">Amount Requested</p>
                <p className="text-base font-semibold mt-0.5">
                  {loan.currency} {loan.principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-secondary/40 rounded-lg py-3 text-center">
                <p className="text-xs text-muted-foreground">Loan Type</p>
                <p className="text-base font-semibold mt-0.5 capitalize">
                  {loan.loanType.replace("_", " ")}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { label: "Interest Rate", value: `${loan.interestRate}%` },
              { label: "Schedule", value: loan.repaymentSchedule.replace("_", " ") },
              { label: "Instalment", value: loan.repaymentAmount ? `${loan.currency} ${loan.repaymentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—" },
              { label: "Disbursed", value: fmtDate(loan.disbursementDate) },
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
      {!["applied", "rejected"].includes(loan.status) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Repayment Log</CardTitle>
              {canAddRepayment && (
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
                      <TableCell className="text-sm">{fmtDate(r.paidAt)}</TableCell>
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
      )}

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

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Reject Application</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Provide a reason for rejecting this loan application.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason <span className="text-destructive">*</span></Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectionReason.trim()}
            >
              Reject Application
            </Button>
          </DialogFooter>
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
