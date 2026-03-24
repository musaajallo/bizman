"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayrollStatusBadge } from "./payroll-status-badge";
import { PayslipEditDialog } from "./payslip-edit-dialog";
import { Pencil } from "lucide-react";

interface Payslip {
  id: string;
  payrollRunId: string;
  employeeName: string;
  employeeNumber: string;
  department: string | null;
  jobTitle: string | null;
  currency: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  otherAllowanceLabel: string | null;
  pensionRate: number;
  pensionContribution: number;
  medicalAidDeduction: number;
  payeTax: number;
  otherDeduction: number;
  otherDeductionLabel: string | null;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  status: string;
  notes: string | null;
  employee: { id: string; photoUrl: string | null; status: string } | null;
}

interface Props {
  payslips: Payslip[];
  runId: string;
  runStatus: string;
  currency: string;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function PayslipTable({ payslips, runId, runStatus, currency }: Props) {
  const [editing, setEditing] = useState<Payslip | null>(null);
  const router = useRouter();

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Employee</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Basic</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Allowances</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Gross</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Deductions</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Net Pay</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No payslips in this run.</td>
                </tr>
              ) : (
                payslips.map((p) => {
                  const allowances = p.housingAllowance + p.transportAllowance + p.otherAllowance;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/africs/accounting/payroll/${runId}/${p.id}`)}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium leading-tight">{p.employeeName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.employeeNumber}{p.department ? ` · ${p.department}` : ""}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {fmt(p.basicSalary, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {allowances > 0 ? fmt(allowances, currency) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">{fmt(p.grossPay, currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-destructive/80 hidden md:table-cell">
                        {p.totalDeductions > 0 ? fmt(p.totalDeductions, currency) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-emerald-400">
                        {fmt(p.netPay, currency)}
                      </td>
                      <td className="py-3 px-4">
                        <PayrollStatusBadge status={p.status} type="payslip" />
                      </td>
                      {runStatus === "draft" && (
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditing(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                      {runStatus !== "draft" && <td className="py-3 px-4 w-20" />}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <PayslipEditDialog payslip={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
