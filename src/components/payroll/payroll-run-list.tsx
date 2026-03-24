import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PayrollStatusBadge } from "./payroll-status-badge";

interface PayrollRun {
  id: string;
  periodLabel: string;
  status: string;
  currency: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  createdAt: Date | string;
}

interface Props {
  runs: PayrollRun[];
}

function fmtCurrency(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function PayrollRunList({ runs }: Props) {
  if (runs.length === 0) {
    return (
      <Card>
        <div className="py-16 text-center text-muted-foreground text-sm">
          No payroll runs yet. Create your first run to get started.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Period</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Employees</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Gross Pay</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Deductions</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Net Pay</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="relative border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                <td className="py-3 px-4">
                  <Link href={`/africs/accounting/payroll/${run.id}`} className="absolute inset-0" aria-label={run.periodLabel} />
                  <span className="font-medium">{run.periodLabel}</span>
                </td>
                <td className="py-3 px-4"><PayrollStatusBadge status={run.status} /></td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{run.employeeCount}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                  {fmtCurrency(run.totalGross, run.currency)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                  {fmtCurrency(run.totalDeductions, run.currency)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-emerald-400">
                  {fmtCurrency(run.totalNet, run.currency)}
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                  {fmtDate(run.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
