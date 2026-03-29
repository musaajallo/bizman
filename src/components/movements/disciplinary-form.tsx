"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDisciplinaryRecord } from "@/lib/actions/movements";

const ACTION_TYPES = [
  { value: "verbal_warning", label: "Verbal Warning" },
  { value: "written_warning", label: "Written Warning" },
  { value: "final_written_warning", label: "Final Written Warning" },
  { value: "suspension", label: "Suspension" },
  { value: "termination", label: "Termination" },
];

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

export function DisciplinaryForm({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState("written_warning");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEmployeeId) { setError("Please select an employee."); return; }
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("actionType", actionType);

    startTransition(async () => {
      const result = await createDisciplinaryRecord(fd);
      if ("error" in result) { setError(result.error ?? "Unknown error"); return; }
      router.push("/africs/hr/movements?tab=disciplinary");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Employee</Label>
          <Select value={selectedEmployeeId} onValueChange={(v: string | null) => { if (v) setSelectedEmployeeId(v); }}>
            <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} · {e.employeeNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="employeeId" value={selectedEmployeeId} />
        </div>

        <div className="space-y-1.5">
          <Label>Action Type</Label>
          <Select value={actionType} onValueChange={(v: string | null) => { if (v) setActionType(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="incidentDate">Incident Date</Label>
        <Input
          id="incidentDate"
          name="incidentDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          className="max-w-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="incidentDescription">Incident Description <span className="text-destructive">*</span></Label>
        <Textarea
          id="incidentDescription"
          name="incidentDescription"
          rows={4}
          placeholder="Describe the incident in detail..."
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="actionTaken">Action Taken</Label>
        <Textarea
          id="actionTaken"
          name="actionTaken"
          rows={3}
          placeholder="Describe what action was or will be taken..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Record Disciplinary Action"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
