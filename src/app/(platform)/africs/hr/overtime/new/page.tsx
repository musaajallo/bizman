import { TopBar } from "@/components/layout/top-bar";
import { OvertimeRequestForm } from "@/components/overtime/overtime-request-form";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { prisma } from "@/lib/prisma";

export default async function NewOvertimePage() {
  const owner = await getOwnerBusiness();

  const [employees, projects] = await Promise.all([
    owner
      ? prisma.employee.findMany({
          where: { tenantId: owner.id, status: { in: ["active", "on_leave"] } },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: { id: true, firstName: true, lastName: true, department: true },
        })
      : [],
    owner
      ? prisma.project.findMany({
          where: { tenantId: owner.id, archivedAt: null },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
  ]);

  return (
    <div>
      <TopBar title="New Overtime Request" subtitle="Submit an overtime request for approval" />
      <div className="p-6">
        <OvertimeRequestForm employees={employees} projects={projects} />
      </div>
    </div>
  );
}
