"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeaveRequest } from "@/lib/actions/leave";
import { LEAVE_TYPES } from "@/lib/leave-types";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string | null;
}

interface Props {
  employees: Employee[];
  defaultEmployeeId?: string;
}

export function LeaveRequestForm({ employees, defaultEmployeeId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLeaveRequest(fd);
      if ("error" in result) {
        setError(result.error ?? "An error occurred");
      } else {
        router.push("/africs/hr/time-off/requests");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="employeeId">Employee</Label>
        <select
          id="employeeId"
          name="employeeId"
          defaultValue={defaultEmployeeId ?? ""}
          required
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName} ({e.employeeNumber}){e.department ? ` — ${e.department}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="leaveType">Leave Type</Label>
        <select
          id="leaveType"
          name="leaveType"
          required
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select type…</option>
          {LEAVE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" name="startDate" type="date" required className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" name="endDate" type="date" required className="h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea id="reason" name="reason" rows={3} placeholder="Brief reason for leave…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit Request"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
