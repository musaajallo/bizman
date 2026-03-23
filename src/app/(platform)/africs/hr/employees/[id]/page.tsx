import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { getEmployee } from "@/lib/actions/employees";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { EmployeeDetailTabs } from "@/components/employees/employee-detail-tabs";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [employee, owner] = await Promise.all([
    getEmployee(id),
    getOwnerBusiness(),
  ]);

  if (!employee || !owner) notFound();

  const typeLabels: Record<string, string> = {
    full_time: "Full-time", part_time: "Part-time", contract: "Contract", intern: "Intern",
  };

  const tenant = {
    id: owner.id,
    name: owner.name,
    logoUrl: owner.logoUrl ?? null,
    primaryColor: owner.primaryColor ?? null,
    accentColor: owner.accentColor ?? null,
  };

  return (
    <div>
      <TopBar
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={[employee.jobTitle, employee.department].filter(Boolean).join(" · ")}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/hr/employees">
              <Button size="sm" variant="ghost" className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                All Employees
              </Button>
            </Link>
            <Link href={`/africs/hr/employees/${id}/edit`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {/* Header card */}
        <div className="flex items-center gap-5 bg-card border rounded-lg p-5">
          <EmployeeAvatar
            firstName={employee.firstName}
            lastName={employee.lastName}
            photoUrl={employee.photoUrl}
            size="xl"
            color={owner.accentColor ?? owner.primaryColor}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold font-display">
                {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ""}{employee.lastName}
              </h2>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <p className="text-muted-foreground mt-0.5">{employee.jobTitle || "—"}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-mono text-xs">{employee.employeeNumber}</span>
              {employee.department && <span>{employee.department}{employee.unit ? ` · ${employee.unit}` : ""}</span>}
              <span>{typeLabels[employee.employmentType] || employee.employmentType}</span>
            </div>
          </div>
        </div>

        {/* Tabs — serialize Decimal fields before crossing server→client boundary */}
        <EmployeeDetailTabs
          employee={{
            ...employee,
            basicSalary: employee.basicSalary ? Number(employee.basicSalary) : null,
            pensionContribution: employee.pensionContribution ? Number(employee.pensionContribution) : null,
            housingAllowance: employee.housingAllowance ? Number(employee.housingAllowance) : null,
            transportAllowance: employee.transportAllowance ? Number(employee.transportAllowance) : null,
            otherAllowance: employee.otherAllowance ? Number(employee.otherAllowance) : null,
            documents: employee.documents,
          }}
          tenant={tenant}
        />
      </div>
    </div>
  );
}
