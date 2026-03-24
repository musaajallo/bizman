import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getPayrollRun } from "@/lib/actions/payroll";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { PayrollRunSummary } from "@/components/payroll/payroll-run-summary";
import { PayslipTable } from "@/components/payroll/payslip-table";
import { PayrollRunActions } from "@/components/payroll/payroll-run-actions";

export default async function PayrollRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [run, owner] = await Promise.all([getPayrollRun(id), getOwnerBusiness()]);

  if (!run || !owner) notFound();

  return (
    <div>
      <TopBar
        title={run.periodLabel}
        subtitle={`${run.employeeCount} employee${run.employeeCount !== 1 ? "s" : ""} · ${run.currency}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/payroll">
              <Button size="sm" variant="ghost" className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                All Runs
              </Button>
            </Link>
            <PayrollRunActions runId={id} status={run.status} />
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <PayrollRunSummary
          status={run.status}
          currency={run.currency}
          totalGross={run.totalGross}
          totalDeductions={run.totalDeductions}
          totalNet={run.totalNet}
          employeeCount={run.employeeCount}
        />
        <div>
          <h3 className="text-sm font-semibold mb-3">Payslips</h3>
          <PayslipTable
            payslips={run.payslips}
            runId={id}
            runStatus={run.status}
            currency={run.currency}
          />
        </div>
      </div>
    </div>
  );
}
