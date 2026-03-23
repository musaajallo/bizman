import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/employees/employee-form";

export default async function NewEmployeePage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const managers = await getEmployeesForSelect(owner.id);

  return (
    <div>
      <TopBar
        title="New Employee"
        subtitle="Add a new employee to the directory"
        actions={
          <Link href="/africs/hr/employees">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <EmployeeForm tenantId={owner.id} managers={managers} />
    </div>
  );
}
