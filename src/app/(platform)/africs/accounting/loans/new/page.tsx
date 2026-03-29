import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoanForm } from "@/components/loans/loan-form";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";

export default async function NewLoanPage() {
  const owner = await getOwnerBusiness();
  const employees = owner ? await getEmployeesForSelect(owner.id) : [];

  return (
    <div>
      <TopBar
        title="New Loan"
        subtitle="Record a staff loan, owner loan or salary advance"
        actions={
          <Link href="/africs/accounting/loans">
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <LoanForm employees={employees} />
      </div>
    </div>
  );
}
