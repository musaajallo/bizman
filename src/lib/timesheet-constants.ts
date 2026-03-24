export const TIMESHEET_CATEGORIES = [
  { value: "work",     label: "Work" },
  { value: "meeting",  label: "Meeting" },
  { value: "training", label: "Training" },
  { value: "admin",    label: "Admin" },
  { value: "travel",   label: "Travel" },
  { value: "sick",     label: "Sick" },
  { value: "overtime", label: "Overtime" },
  { value: "other",    label: "Other" },
] as const;

export type TimesheetCategoryValue = (typeof TIMESHEET_CATEGORIES)[number]["value"];

export const TIMESHEET_STATUSES = [
  { value: "",          label: "All" },
  { value: "draft",     label: "Draft" },
  { value: "submitted", label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "rejected",  label: "Rejected" },
] as const;

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected";

/** Given any Date, return the Monday (ISO week start) as a UTC midnight Date. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Return 7 Date objects (Mon–Sun) for a given weekStart. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

/** Format weekStart as "12 Mar – 18 Mar 2026" */
export function formatWeekRange(weekStart: Date | string): string {
  const s = new Date(weekStart);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`;
}

/** Return ISO date string "YYYY-MM-DD" for a UTC Date */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
