import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoanForm } from "@/components/loans/loan-form";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { getLoanSettings } from "@/lib/actions/loan-settings";

export default async function NewLoanPage() {
  const owner = await getOwnerBusiness();
  const [employees, loanSettings] = await Promise.all([
    owner ? getEmployeesForSelect(owner.id) : Promise.resolve([]),
    getLoanSettings(),
  ]);

  return (
    <div>
      <TopBar
        title="Loan Application"
        subtitle="Submit a staff loan, owner loan or salary advance request"
        actions={
          <Link href="/africs/accounting/loans">
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <LoanForm employees={employees} requireApproval={loanSettings?.requireApproval ?? true} />
      </div>
    </div>
  );
}
