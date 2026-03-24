"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { saveTimesheetEntries, submitTimesheet, type EntryInput } from "@/lib/actions/timesheets";
import { TIMESHEET_CATEGORIES, getWeekDates, toISODate } from "@/lib/timesheet-constants";

interface Project { id: string; name: string; }

interface ExistingEntry {
  id: string;
  date: string;
  hours: number;
  category: string;
  projectId: string | null;
  description: string | null;
}

interface Props {
  timesheetId: string;
  weekStart: string;
  projects: Project[];
  existingEntries?: ExistingEntry[];
  onSaved?: () => void;
}

interface RowState {
  key: number;           // local key for react
  category: string;
  projectId: string;
  description: string;
  hours: Record<string, string>; // date → hours string
}

let KEY = 0;

function newRow(date?: string, hours?: number, category?: string, projectId?: string | null, description?: string | null): RowState {
  return {
    key: KEY++,
    category: category ?? "work",
    projectId: projectId ?? "",
    description: description ?? "",
    hours: date ? { [date]: String(hours ?? 0) } : {},
  };
}

function buildInitialRows(entries: ExistingEntry[], weekDates: Date[]): RowState[] {
  if (!entries.length) return [newRow()];

  // Group entries by category+projectId+description — same combination = same row
  const rowMap = new Map<string, RowState>();

  for (const e of entries) {
    const key = `${e.category}|${e.projectId ?? ""}|${(e.description ?? "").trim()}`;
    if (!rowMap.has(key)) {
      rowMap.set(key, newRow(undefined, undefined, e.category, e.projectId, e.description));
    }
    const row = rowMap.get(key)!;
    row.hours[e.date.slice(0, 10)] = String(e.hours);
  }

  // Ensure all 7 dates exist in each row
  const rows = Array.from(rowMap.values());
  for (const row of rows) {
    for (const d of weekDates) {
      const iso = toISODate(d);
      if (!(iso in row.hours)) row.hours[iso] = "";
    }
  }

  return rows;
}

export function TimesheetGrid({ timesheetId, weekStart, projects, existingEntries = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const weekDates = getWeekDates(new Date(weekStart));

  const [rows, setRows] = useState<RowState[]>(() => buildInitialRows(existingEntries, weekDates));

  function addRow() {
    const base: Record<string, string> = {};
    weekDates.forEach((d) => { base[toISODate(d)] = ""; });
    setRows((prev) => [...prev, { key: KEY++, category: "work", projectId: "", description: "", hours: { ...base } }]);
  }

  function removeRow(key: number) {
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.key !== key) : prev);
  }

  function updateRow(key: number, field: keyof Omit<RowState, "key" | "hours">, value: string | null) {
    if (value === null) return;
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, [field]: value } : r));
  }

  function updateHours(key: number, date: string, value: string) {
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, hours: { ...r.hours, [date]: value } } : r));
  }

  function buildEntries(): EntryInput[] {
    const out: EntryInput[] = [];
    for (const row of rows) {
      for (const d of weekDates) {
        const iso = toISODate(d);
        const h = parseFloat(row.hours[iso] ?? "");
        if (isNaN(h) || h <= 0) continue;
        out.push({
          date: iso,
          hours: h,
          category: row.category,
          projectId: row.projectId || null,
          description: row.description || null,
        });
      }
    }
    return out;
  }

  function dailyTotal(date: Date): number {
    const iso = toISODate(date);
    return rows.reduce((sum, row) => {
      const h = parseFloat(row.hours[iso] ?? "");
      return sum + (isNaN(h) ? 0 : h);
    }, 0);
  }

  const weekTotal = weekDates.reduce((sum, d) => sum + dailyTotal(d), 0);

  function handleSave() {
    setError(null);
    const entries = buildEntries();
    startTransition(async () => {
      const r = await saveTimesheetEntries(timesheetId, entries);
      if ("error" in r) { setError(r.error ?? "Error"); return; }
      router.refresh();
    });
  }

  function handleSaveAndSubmit() {
    setError(null);
    const entries = buildEntries();
    if (entries.length === 0) { setError("Add at least one entry with hours before submitting."); return; }
    startTransition(async () => {
      const r1 = await saveTimesheetEntries(timesheetId, entries);
      if ("error" in r1) { setError(r1.error ?? "Error"); return; }
      const r2 = await submitTimesheet(timesheetId);
      if ("error" in r2) { setError(r2.error ?? "Error"); return; }
      router.push(`/africs/hr/timesheets/${timesheetId}`);
    });
  }

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      {/* Desktop grid */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-28">Category</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-36 hidden xl:table-cell">Project</th>
              {weekDates.map((d, i) => (
                <th key={i} className="py-2 px-2 text-xs font-medium text-center w-14">
                  <div className={`${[5,6].includes(i) ? "text-muted-foreground" : "text-foreground"}`}>{dayLabels[i]}</div>
                  <div className="text-muted-foreground font-normal">{d.getUTCDate()}</div>
                </th>
              ))}
              <th className="py-2 px-2 text-xs font-medium text-right w-14 text-muted-foreground">Total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowTotal = weekDates.reduce((sum, d) => {
                const h = parseFloat(row.hours[toISODate(d)] ?? "");
                return sum + (isNaN(h) ? 0 : h);
              }, 0);
              return (
                <tr key={row.key} className="border-b border-border/40 group">
                  <td className="py-2 px-1">
                    <Select value={row.category} onValueChange={(v) => { if (v) updateRow(row.key, "category", v); }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMESHEET_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-1 hidden xl:table-cell">
                    <Select value={row.projectId || "__none__"} onValueChange={(v) => updateRow(row.key, "projectId", v === "__none__" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  {weekDates.map((d) => {
                    const iso = toISODate(d);
                    return (
                      <td key={iso} className="py-2 px-1">
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={row.hours[iso] ?? ""}
                          onChange={(e) => updateHours(row.key, iso, e.target.value)}
                          className="h-8 text-xs text-center w-12 font-mono px-1"
                          placeholder="—"
                        />
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-right font-mono text-xs font-semibold">
                    {rowTotal > 0 ? `${rowTotal}h` : "—"}
                  </td>
                  <td className="py-2 px-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={2} className="py-2 px-3 text-xs font-medium text-muted-foreground hidden xl:table-cell" />
              <td className="py-2 px-3 text-xs font-medium text-muted-foreground xl:hidden" />
              {weekDates.map((d) => (
                <td key={toISODate(d)} className="py-2 px-2 text-center text-xs font-mono font-semibold">
                  {dailyTotal(d) > 0 ? `${dailyTotal(d)}h` : ""}
                </td>
              ))}
              <td className="py-2 px-2 text-right text-sm font-bold font-mono">
                {weekTotal > 0 ? `${weekTotal}h` : "—"}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: card per row */}
      <div className="lg:hidden space-y-3">
        {rows.map((row, idx) => {
          const rowTotal = weekDates.reduce((sum, d) => {
            const h = parseFloat(row.hours[toISODate(d)] ?? "");
            return sum + (isNaN(h) ? 0 : h);
          }, 0);
          return (
            <div key={row.key} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Row {idx + 1}</span>
                <div className="flex items-center gap-2">
                  {rowTotal > 0 && <span className="font-mono text-sm font-semibold">{rowTotal}h</span>}
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(row.key)} disabled={rows.length === 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select value={row.category} onValueChange={(v) => { if (v) updateRow(row.key, "category", v); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMESHEET_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {projects.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Project</Label>
                    <Select value={row.projectId || "__none__"} onValueChange={(v) => updateRow(row.key, "projectId", v === "__none__" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((d, i) => {
                  const iso = toISODate(d);
                  return (
                    <div key={iso} className="space-y-1 text-center">
                      <p className={`text-xs ${[5,6].includes(i) ? "text-muted-foreground" : ""}`}>{dayLabels[i]}</p>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={row.hours[iso] ?? ""}
                        onChange={(e) => updateHours(row.key, iso, e.target.value)}
                        className="h-8 text-xs text-center px-1 font-mono"
                        placeholder="—"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Mobile week total */}
        {weekTotal > 0 && (
          <div className="flex justify-end text-sm font-bold px-1">
            Week Total: <span className="font-mono ml-2">{weekTotal}h</span>
          </div>
        )}
      </div>

      {/* Description rows for all */}
      {rows.some((r) => true) && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes per row</p>
          {rows.map((row, idx) => (
            <div key={row.key} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground mt-2 w-8 shrink-0">Row {idx + 1}</span>
              <Textarea
                rows={1}
                value={row.description}
                onChange={(e) => updateRow(row.key, "description", e.target.value)}
                placeholder="Description (optional)"
                className="text-xs resize-none"
              />
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />Add Row
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Draft"}
        </Button>
        <Button type="button" onClick={handleSaveAndSubmit} disabled={isPending}>
          {isPending ? "Saving…" : "Save & Submit"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
      </div>
    </div>
  );
}
