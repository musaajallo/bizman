import { TopBar } from "@/components/layout/top-bar";
import { getEmployee } from "@/lib/actions/employees";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { EmployeeDetailTabs } from "@/components/employees/employee-detail-tabs";
import { EmployeeHeaderActions } from "@/components/employees/employee-header-actions";

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
        actions={<EmployeeHeaderActions employeeId={id} currentStatus={employee.status} />}
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
              <EmployeeStatusBadge status={employee.status} leaveType={employee.leaveType} />
            </div>
            <p className="text-muted-foreground mt-0.5">{employee.jobTitle || "—"}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-mono text-xs">{employee.employeeNumber}</span>
              {employee.department && <span>{employee.department}{employee.unit ? ` · ${employee.unit}` : ""}</span>}
              <span>{typeLabels[employee.employmentType] || employee.employmentType}</span>
              {employee.status === "on_leave" && employee.leaveEndDate && (
                <span>Returns {new Date(employee.leaveEndDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              )}
              {(employee.status === "terminated" || employee.status === "resigned") && employee.terminationReason && (
                <span className="italic">{employee.terminationReason}</span>
              )}
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
