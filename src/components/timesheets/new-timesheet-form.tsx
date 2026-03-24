"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createTimesheet } from "@/lib/actions/timesheets";
import { getWeekStart, toISODate } from "@/lib/timesheet-constants";

interface Employee { id: string; firstName: string; lastName: string; department: string | null; }

export function NewTimesheetForm({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [weekInput, setWeekInput] = useState(toISODate(getWeekStart(new Date())));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!employeeId) { setError("Select an employee."); return; }

    const weekStart = toISODate(getWeekStart(new Date(weekInput)));

    startTransition(async () => {
      const r = await createTimesheet(employeeId, weekStart);
      if ("error" in r) { setError(r.error ?? "Error"); return; }
      router.push(`/africs/hr/timesheets/${r.id}/edit`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="space-y-2">
        <Label>Employee <span className="text-destructive">*</span></Label>
        <Select value={employeeId} onValueChange={(v) => { if (v) setEmployeeId(v); }} required>
          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
                {emp.department ? ` — ${emp.department}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="week">Week (any day in the week)</Label>
        <Input
          id="week"
          type="date"
          value={weekInput}
          onChange={(e) => setWeekInput(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">The Monday of the selected week will be used as the week start.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Creating…" : "Create Timesheet"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
      </div>
    </form>
  );
}
