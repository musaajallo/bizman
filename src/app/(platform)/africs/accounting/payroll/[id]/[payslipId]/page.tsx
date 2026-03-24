import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getPayslip } from "@/lib/actions/payroll";
import { PayslipDetailCard } from "@/components/payroll/payslip-detail-card";

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string; payslipId: string }>;
}) {
  const { id, payslipId } = await params;
  const payslip = await getPayslip(payslipId);

  if (!payslip) notFound();

  return (
    <div>
      <TopBar
        title={payslip.employeeName}
        subtitle={`Payslip · ${payslip.payrollRun.periodLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/africs/accounting/payroll/${id}`}>
              <Button size="sm" variant="ghost" className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
            <a
              href={`/api/payroll/${id}/payslip/${payslipId}/pdf`}
              download={`Payslip-${payslip.employeeNumber}-${payslip.payrollRun.periodLabel}.pdf`}
            >
              <Button size="sm" variant="outline" className="gap-2">
                <FileText className="h-3.5 w-3.5" />
                Download PDF
              </Button>
            </a>
          </div>
        }
      />
      <div className="p-6">
        <PayslipDetailCard payslip={payslip} periodLabel={payslip.payrollRun.periodLabel} />
      </div>
    </div>
  );
}
