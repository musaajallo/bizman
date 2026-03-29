"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { createStaffMovement } from "@/lib/actions/movements";

const MOVEMENT_TYPES = [
  { value: "promotion", label: "Promotion" },
  { value: "demotion", label: "Demotion" },
  { value: "lateral", label: "Lateral Transfer" },
  { value: "department_transfer", label: "Department Transfer" },
  { value: "role_change", label: "Role Change" },
];

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  jobTitle: string | null;
  department: string | null;
  unit: string | null;
  basicSalary: number | null;
}

export function MovementForm({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [movementType, setMovementType] = useState("promotion");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [applyNow, setApplyNow] = useState(true);
  const [error, setError] = useState("");

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const isTransfer = movementType === "department_transfer";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEmployeeId) { setError("Please select an employee."); return; }
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("movementType", movementType);
    fd.set("applyNow", applyNow ? "true" : "false");

    // Populate old values from selected employee
    if (selectedEmployee) {
      if (selectedEmployee.jobTitle) fd.set("oldJobTitle", selectedEmployee.jobTitle);
      if (selectedEmployee.department) fd.set("oldDepartment", selectedEmployee.department);
      if (selectedEmployee.unit) fd.set("oldUnit", selectedEmployee.unit);
      if (selectedEmployee.basicSalary != null) fd.set("oldBasicSalary", String(selectedEmployee.basicSalary));
    }

    startTransition(async () => {
      const result = await createStaffMovement(fd);
      if ("error" in result) { setError(result.error); return; }
      router.push("/africs/hr/movements");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
          <Label>Movement Type</Label>
          <Select value={movementType} onValueChange={(v: string | null) => { if (v) setMovementType(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOVEMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Before / After comparison */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <Card className="bg-secondary/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current</p>
            {isTransfer ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Input value={selectedEmployee?.department ?? ""} disabled placeholder="—" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unit</Label>
                  <Input value={selectedEmployee?.unit ?? ""} disabled placeholder="—" className="h-8 text-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Job Title</Label>
                  <Input value={selectedEmployee?.jobTitle ?? ""} disabled placeholder="—" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Basic Salary</Label>
                  <Input value={selectedEmployee?.basicSalary != null ? String(selectedEmployee.basicSalary) : ""} disabled placeholder="—" className="h-8 text-sm" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="pt-10 text-muted-foreground">
          <ArrowRight className="h-5 w-5" />
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-primary uppercase tracking-wide">New</p>
            {isTransfer ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="newDepartment">New Department</Label>
                  <Input id="newDepartment" name="newDepartment" placeholder="Department name" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="newUnit">New Unit</Label>
                  <Input id="newUnit" name="newUnit" placeholder="Unit name" className="h-8 text-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="newJobTitle">New Job Title</Label>
                  <Input id="newJobTitle" name="newJobTitle" placeholder="Job title" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="newBasicSalary">New Basic Salary</Label>
                  <Input id="newBasicSalary" name="newBasicSalary" type="number" step="0.01" placeholder="0.00" className="h-8 text-sm" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="effectiveDate">Effective Date</Label>
          <Input
            id="effectiveDate"
            name="effectiveDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason / Notes</Label>
        <Textarea id="reason" name="reason" rows={3} placeholder="Optional reason or notes for this movement..." />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="applyNow"
          checked={applyNow}
          onCheckedChange={(v) => setApplyNow(!!v)}
        />
        <Label htmlFor="applyNow" className="font-normal cursor-pointer text-sm">
          Apply changes to employee record immediately
        </Label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Record Movement"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
