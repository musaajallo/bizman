import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getEmployee, getEmployeesForSelect } from "@/lib/actions/employees";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/employees/employee-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [employee, managers] = await Promise.all([
    getEmployee(id),
    getEmployeesForSelect(owner.id),
  ]);

  if (!employee) notFound();

  // Convert Decimal fields to numbers for the form
  const employeeData = {
    ...employee,
    basicSalary: employee.basicSalary ? Number(employee.basicSalary) : null,
    pensionContribution: employee.pensionContribution ? Number(employee.pensionContribution) : null,
    housingAllowance: employee.housingAllowance ? Number(employee.housingAllowance) : null,
    transportAllowance: employee.transportAllowance ? Number(employee.transportAllowance) : null,
    otherAllowance: employee.otherAllowance ? Number(employee.otherAllowance) : null,
  };

  return (
    <div>
      <TopBar
        title={`Edit — ${employee.firstName} ${employee.lastName}`}
        subtitle={employee.employeeNumber}
        actions={
          <Link href={`/africs/hr/employees/${id}`}>
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </Link>
        }
      />
      <EmployeeForm tenantId={owner.id} managers={managers} employee={employeeData} />
    </div>
  );
}
