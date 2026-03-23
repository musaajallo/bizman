import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function PayrollPage() {
  return (
    <div>
      <TopBar title="Payroll" subtitle="Salary processing and payslips" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Payroll</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Salary processing, payslip generation, and tax calculations are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
