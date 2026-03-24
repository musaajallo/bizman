import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollStatusBadge } from "./payroll-status-badge";

interface Payslip {
  employeeName: string;
  employeeNumber: string;
  jobTitle: string | null;
  department: string | null;
  currency: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  otherAllowanceLabel: string | null;
  grossPay: number;
  pensionRate: number;
  pensionContribution: number;
  medicalAidDeduction: number;
  payeTax: number;
  otherDeduction: number;
  otherDeductionLabel: string | null;
  totalDeductions: number;
  netPay: number;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  status: string;
  notes: string | null;
}

interface Props {
  payslip: Payslip;
  periodLabel: string;
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between py-2 border-b border-border/40 last:border-0 ${bold ? "font-semibold" : ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono ${accent ? "text-emerald-400 text-base font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function PayslipDetailCard({ payslip, periodLabel }: Props) {
  const currency = payslip.currency;

  return (
    <div className="space-y-4">
      {/* Employee info */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-5">
        <div>
          <h2 className="text-xl font-bold">{payslip.employeeName}</h2>
          <p className="text-muted-foreground text-sm">{payslip.jobTitle || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{payslip.employeeNumber}{payslip.department ? ` · ${payslip.department}` : ""}</p>
        </div>
        <div className="text-right space-y-1">
          <PayrollStatusBadge status={payslip.status} type="payslip" />
          <p className="text-xs text-muted-foreground">{periodLabel}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Earnings */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Earnings</CardTitle></CardHeader>
          <CardContent>
            <Row label="Basic Salary" value={fmt(payslip.basicSalary, currency)} />
            {payslip.housingAllowance > 0 && <Row label="Housing Allowance" value={fmt(payslip.housingAllowance, currency)} />}
            {payslip.transportAllowance > 0 && <Row label="Transport Allowance" value={fmt(payslip.transportAllowance, currency)} />}
            {payslip.otherAllowance > 0 && (
              <Row label={payslip.otherAllowanceLabel || "Other Allowance"} value={fmt(payslip.otherAllowance, currency)} />
            )}
            <Row label="Gross Pay" value={fmt(payslip.grossPay, currency)} bold />
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Deductions</CardTitle></CardHeader>
          <CardContent>
            {payslip.pensionContribution > 0 && (
              <Row label={`Pension (${payslip.pensionRate}%)`} value={fmt(payslip.pensionContribution, currency)} />
            )}
            {payslip.medicalAidDeduction > 0 && (
              <Row label="Medical Aid" value={fmt(payslip.medicalAidDeduction, currency)} />
            )}
            {payslip.payeTax > 0 && <Row label="PAYE Tax" value={fmt(payslip.payeTax, currency)} />}
            {payslip.otherDeduction > 0 && (
              <Row label={payslip.otherDeductionLabel || "Other Deduction"} value={fmt(payslip.otherDeduction, currency)} />
            )}
            {payslip.totalDeductions === 0 && (
              <p className="text-xs text-muted-foreground py-2">No deductions</p>
            )}
            {payslip.totalDeductions > 0 && (
              <Row label="Total Deductions" value={fmt(payslip.totalDeductions, currency)} bold />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Pay */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Net Pay</span>
          <span className="text-3xl font-bold font-mono text-emerald-400">{fmt(payslip.netPay, currency)}</span>
        </CardContent>
      </Card>

      {/* Bank details */}
      {(payslip.bankName || payslip.bankAccountNumber) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bank Details</CardTitle></CardHeader>
          <CardContent>
            {payslip.bankName && <Row label="Bank" value={payslip.bankName} />}
            {payslip.bankAccountName && <Row label="Account Name" value={payslip.bankAccountName} />}
            {payslip.bankAccountNumber && <Row label="Account Number" value={payslip.bankAccountNumber} />}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {payslip.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{payslip.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
