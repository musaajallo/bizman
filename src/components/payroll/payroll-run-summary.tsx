import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, TrendingDown, Banknote } from "lucide-react";
import { PayrollStatusBadge } from "./payroll-status-badge";

interface Props {
  status: string;
  currency: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

function fmtCurrency(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function PayrollRunSummary({ status, currency, totalGross, totalDeductions, totalNet, employeeCount }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{employeeCount}</p>
            <p className="text-xs text-muted-foreground">Employees</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-500/10">
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{fmtCurrency(totalGross, currency)}</p>
            <p className="text-xs text-muted-foreground">Gross Pay</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-red-500/10">
            <TrendingDown className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{fmtCurrency(totalDeductions, currency)}</p>
            <p className="text-xs text-muted-foreground">Deductions</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10">
            <Banknote className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-emerald-400">{fmtCurrency(totalNet, currency)}</p>
            <p className="text-xs text-muted-foreground">Net Pay</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Status</p>
            <PayrollStatusBadge status={status} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
