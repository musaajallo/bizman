"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TimesheetStatusBadge } from "./timesheet-status-badge";
import { formatWeekRange } from "@/lib/timesheet-constants";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  photoUrl: string | null;
}

interface Timesheet {
  id: string;
  weekStart: string;
  totalHours: number;
  status: string;
  submittedAt: string | null;
  employee: Employee;
}

export function TimesheetListTable({ timesheets }: { timesheets: Timesheet[] }) {
  const router = useRouter();

  if (timesheets.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground text-sm">No timesheets found.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Employee</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Week</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Hours</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/africs/hr/timesheets/${t.id}`)}
              >
                <td className="py-3 px-4">
                  <p className="font-medium">{t.employee.firstName} {t.employee.lastName}</p>
                  {t.employee.department && (
                    <p className="text-xs text-muted-foreground">{t.employee.department}</p>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {formatWeekRange(t.weekStart)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold hidden sm:table-cell">
                  {t.totalHours > 0 ? `${t.totalHours}h` : "—"}
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                  {t.submittedAt
                    ? new Date(t.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : "—"}
                </td>
                <td className="py-3 px-4">
                  <TimesheetStatusBadge status={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
