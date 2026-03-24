import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getTimesheet } from "@/lib/actions/timesheets";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { TimesheetGrid } from "@/components/timesheets/timesheet-grid";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatWeekRange } from "@/lib/timesheet-constants";
import { prisma } from "@/lib/prisma";

export default async function EditTimesheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const timesheet = await getTimesheet(id);
  if (!timesheet || timesheet.status !== "draft") notFound();

  const owner = await getOwnerBusiness();
  const projects = owner
    ? await prisma.project.findMany({
        where: { tenantId: owner.id, status: { not: "archived" } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <TopBar
        title={`${timesheet.employee.firstName} ${timesheet.employee.lastName}`}
        subtitle={formatWeekRange(timesheet.weekStart)}
        actions={
          <Link href={`/africs/hr/timesheets/${id}`}>
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <TimesheetGrid
              timesheetId={timesheet.id}
              weekStart={timesheet.weekStart}
              projects={projects}
              existingEntries={timesheet.entries}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
