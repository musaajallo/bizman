import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PayrollRunForm } from "@/components/payroll/payroll-run-form";

export default function NewPayrollRunPage() {
  return (
    <div>
      <TopBar
        title="New Payroll Run"
        subtitle="Generate payslips for all active employees"
        actions={
          <Link href="/africs/accounting/payroll">
            <Button size="sm" variant="ghost" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <PayrollRunForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
