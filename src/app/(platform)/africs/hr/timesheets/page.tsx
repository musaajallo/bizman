import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getTimesheets, getTimesheetStats } from "@/lib/actions/timesheets";
import { TIMESHEET_STATUSES } from "@/lib/timesheet-constants";
import { TimesheetListTable } from "@/components/timesheets/timesheet-list-table";
import { TimesheetStatsCards } from "@/components/timesheets/timesheet-stats-cards";
import { Plus } from "lucide-react";

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [timesheets, stats] = await Promise.all([
    getTimesheets({ status }),
    getTimesheetStats(),
  ]);

  return (
    <div>
      <TopBar
        title="Timesheets"
        subtitle="Employee weekly time submissions"
        actions={
          <Link href="/africs/hr/timesheets/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Timesheet
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        <TimesheetStatsCards stats={stats} />
        <div className="flex gap-1 border-b border-border pb-0">
          {TIMESHEET_STATUSES.map((s) => {
            const isActive = (status ?? "") === s.value;
            const href = s.value
              ? `/africs/hr/timesheets?status=${s.value}`
              : "/africs/hr/timesheets";
            return (
              <Link
                key={s.value}
                href={href}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <TimesheetListTable timesheets={timesheets} />
      </div>
    </div>
  );
}
