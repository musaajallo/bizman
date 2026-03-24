"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOvertimeRequest } from "@/lib/actions/overtime";
import { OVERTIME_TYPES } from "@/lib/overtime-constants";
import { toISODate } from "@/lib/timesheet-constants";

interface Employee { id: string; firstName: string; lastName: string; department: string | null; }
interface Project { id: string; name: string; }

interface Props {
  employees: Employee[];
  projects: Project[];
}

export function OvertimeRequestForm({ employees, projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOvertimeRequest(formData);
      if ("error" in result) { setError(result.error ?? "Error"); return; }
      router.push("/africs/hr/overtime");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <Label>Employee <span className="text-destructive">*</span></Label>
        <Select name="employeeId" required>
          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
                {e.department ? ` — ${e.department}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={toISODate(new Date())}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Hours <span className="text-destructive">*</span></Label>
          <Input
            id="hours"
            name="hours"
            type="number"
            min="0.5"
            max="16"
            step="0.5"
            placeholder="e.g. 2"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Overtime Type <span className="text-destructive">*</span></Label>
        <Select name="overtimeType" defaultValue="standard">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {OVERTIME_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label} ({t.rateMultiplier}×)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {projects.length > 0 && (
        <div className="space-y-2">
          <Label>Project (optional)</Label>
          <Select name="projectId">
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
        <Textarea
          id="reason"
          name="reason"
          rows={3}
          placeholder="Briefly describe why overtime is required…"
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit Request"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
