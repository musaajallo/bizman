"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreHorizontal, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { deleteLoan, updateLoanStatus } from "@/lib/actions/loans";

const STATUS_STYLES: Record<string, string> = {
  applied:     "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  approved:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rejected:    "bg-red-500/10 text-red-400 border-red-500/20",
  disbursed:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  settled:     "bg-teal-500/10 text-teal-400 border-teal-500/20",
  defaulted:   "bg-red-500/10 text-red-400 border-red-500/20",
  written_off: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  staff_loan: "Staff Loan",
  owner_loan: "Owner Loan",
  salary_advance: "Salary Advance",
};

interface Loan {
  id: string;
  loanNumber: string;
  loanType: string;
  borrowerName: string;
  principal: number;
  currency: string;
  status: string;
  disbursementDate: string | null;
  amountPaid: number;
  employee: { id: string; firstName: string; lastName: string } | null;
}

export function LoansTable({ loans }: { loans: Loan[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteLoan(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateLoanStatus(id, status);
      router.refresh();
    });
  }

  if (loans.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No loans recorded yet.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loan #</TableHead>
            <TableHead>Borrower</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((l) => {
            const outstanding = l.principal - l.amountPaid;
            const progressPct = l.principal > 0 ? Math.round((l.amountPaid / l.principal) * 100) : 0;

            return (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.loanNumber}</TableCell>
                <TableCell>
                  {l.employee ? (
                    <Link href={`/africs/hr/employees/${l.employee.id}`} className="font-medium hover:underline">
                      {l.employee.firstName} {l.employee.lastName}
                    </Link>
                  ) : (
                    <span className="font-medium">{l.borrowerName}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {TYPE_LABELS[l.loanType] ?? l.loanType}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {l.currency} {l.principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`font-mono text-sm ${outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {l.currency} {outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(progressPct, 100)}%` }} />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${STATUS_STYLES[l.status] ?? ""}`}>
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1).replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href={`/africs/accounting/loans/${l.id}`} />}>
                        <ExternalLink className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      {l.status === "approved" && (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(l.id, "disbursed")}>
                          Mark Disbursed
                        </DropdownMenuItem>
                      )}
                      {l.status === "disbursed" && (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(l.id, "active")}>
                          Mark Active
                        </DropdownMenuItem>
                      )}
                      {l.status === "active" && (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(l.id, "settled")}>
                          Mark Settled
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeleteId(l.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Loan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the loan and all repayment records.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
