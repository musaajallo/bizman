import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PayrollStatusBadge } from "./payroll-status-badge";
import { FileText } from "lucide-react";

interface Payslip {
  id: string;
  payrollRunId: string;
  currency: string;
  grossPay: number;
  netPay: number;
  status: string;
  employeeNumber: string;
  payrollRun: {
    periodLabel: string;
    periodMonth: number;
    periodYear: number;
    status: string;
  };
}

interface Props {
  payslips: Payslip[];
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function PayslipHistory({ payslips }: Props) {
  if (payslips.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center text-muted-foreground text-sm">No payslips on record.</div>
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
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Gross</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Net Pay</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-3 px-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {payslips.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-medium">{p.payrollRun.periodLabel}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                  {fmt(p.grossPay, p.currency)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-emerald-400">
                  {fmt(p.netPay, p.currency)}
                </td>
                <td className="py-3 px-4"><PayrollStatusBadge status={p.status} type="payslip" /></td>
                <td className="py-3 px-4">
                  <a
                    href={`/api/payroll/${p.payrollRunId}/payslip/${p.id}/pdf`}
                    download={`Payslip-${p.employeeNumber}-${p.payrollRun.periodLabel}.pdf`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Download Payslip"
                  >
                    <FileText className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
