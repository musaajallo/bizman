import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getTimesheet } from "@/lib/actions/timesheets";
import { TimesheetDetailCard } from "@/components/timesheets/timesheet-detail-card";
import { TimesheetActions } from "@/components/timesheets/timesheet-actions";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatWeekRange } from "@/lib/timesheet-constants";

export default async function TimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const timesheet = await getTimesheet(id);
  if (!timesheet) notFound();

  return (
    <div>
      <TopBar
        title={`${timesheet.employee.firstName} ${timesheet.employee.lastName}`}
        subtitle={formatWeekRange(timesheet.weekStart)}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/hr/timesheets">
              <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <TimesheetActions timesheetId={timesheet.id} status={timesheet.status} />
          </div>
        }
      />
      <div className="p-6">
        <TimesheetDetailCard timesheet={timesheet} />
      </div>
    </div>
  );
}
