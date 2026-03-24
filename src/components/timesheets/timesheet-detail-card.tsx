import { Card } from "@/components/ui/card";
import { TimesheetStatusBadge } from "./timesheet-status-badge";
import { TimesheetCategoryBadge } from "./timesheet-category-badge";
import { formatWeekRange, getWeekDates, toISODate } from "@/lib/timesheet-constants";

interface Entry {
  id: string;
  date: string;
  hours: number;
  category: string;
  projectId: string | null;
  description: string | null;
  project: { id: string; name: string } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  jobTitle: string | null;
  department: string | null;
}

interface ReviewedBy {
  id: string;
  name: string | null;
}

interface TimesheetDetail {
  id: string;
  weekStart: string;
  totalHours: number;
  status: string;
  notes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  employee: Employee;
  reviewedBy: ReviewedBy | null;
  entries: Entry[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TimesheetDetailCard({ timesheet }: { timesheet: TimesheetDetail }) {
  const weekDates = getWeekDates(new Date(timesheet.weekStart));

  // Group entries by date
  const byDate = new Map<string, Entry[]>();
  for (const e of timesheet.entries) {
    const iso = e.date.slice(0, 10);
    if (!byDate.has(iso)) byDate.set(iso, []);
    byDate.get(iso)!.push(e);
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">{timesheet.employee.firstName} {timesheet.employee.lastName}</p>
              <span className="text-xs text-muted-foreground">#{timesheet.employee.employeeNumber}</span>
              <TimesheetStatusBadge status={timesheet.status} />
            </div>
            {timesheet.employee.department && (
              <p className="text-xs text-muted-foreground">{timesheet.employee.department} {timesheet.employee.jobTitle ? `· ${timesheet.employee.jobTitle}` : ""}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{formatWeekRange(timesheet.weekStart)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono">{timesheet.totalHours}h</p>
            <p className="text-xs text-muted-foreground">total hours</p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Weekly grid */}
        <div className="space-y-3">
          {weekDates.map((d, i) => {
            const iso = toISODate(d);
            const dayEntries = byDate.get(iso) ?? [];
            const dayTotal = dayEntries.reduce((s, e) => s + e.hours, 0);
            const isWeekend = i >= 5;

            return (
              <div key={iso}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className={`text-xs font-semibold w-8 ${isWeekend ? "text-muted-foreground" : ""}`}>{DAY_LABELS[i]}</p>
                  <p className={`text-xs ${isWeekend ? "text-muted-foreground" : "text-muted-foreground"}`}>{fmtDate(iso)}</p>
                  {dayTotal > 0 && <span className="ml-auto font-mono text-xs font-semibold">{dayTotal}h</span>}
                </div>
                {dayEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 ml-10">—</p>
                ) : (
                  <div className="ml-10 space-y-1">
                    {dayEntries.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold w-8">{e.hours}h</span>
                        <TimesheetCategoryBadge category={e.category} />
                        {e.project && <span className="text-xs text-muted-foreground">· {e.project.name}</span>}
                        {e.description && <span className="text-xs text-muted-foreground/70">— {e.description}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: timestamps + reviewer notes */}
        {(timesheet.submittedAt || timesheet.reviewedAt || timesheet.notes) && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-2 text-xs text-muted-foreground">
              {timesheet.submittedAt && <p>Submitted on {fmtDate(timesheet.submittedAt)}</p>}
              {timesheet.reviewedAt && timesheet.reviewedBy && (
                <p>
                  {timesheet.status === "approved" ? "Approved" : "Reviewed"} by{" "}
                  <span className="font-medium text-foreground">{timesheet.reviewedBy.name}</span> on {fmtDate(timesheet.reviewedAt)}
                </p>
              )}
              {timesheet.notes && (
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground mb-0.5">Reviewer note</p>
                  <p className="whitespace-pre-wrap">{timesheet.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
