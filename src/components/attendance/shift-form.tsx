"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createShift, updateShift } from "@/lib/actions/attendance";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

interface ShiftData {
  id?: string;
  name?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  gracePeriodMins?: number;
  overtimeAfterMins?: number;
  workDays?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

interface Props {
  existing?: ShiftData;
}

export function ShiftForm({ existing }: Props) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState(existing?.type ?? "fixed");
  const [startTime, setStartTime] = useState(existing?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "17:00");
  const [breakMinutes, setBreakMinutes] = useState(String(existing?.breakMinutes ?? 60));
  const [gracePeriodMins, setGracePeriodMins] = useState(String(existing?.gracePeriodMins ?? 15));
  const [overtimeAfterMins, setOvertimeAfterMins] = useState(String(existing?.overtimeAfterMins ?? 0));
  const [workDays, setWorkDays] = useState<string[]>(existing?.workDays ?? ["mon","tue","wed","thu","fri"]);
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: string) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Shift name is required"); return; }
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("type", type);
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);
    formData.set("breakMinutes", breakMinutes);
    formData.set("gracePeriodMins", gracePeriodMins);
    formData.set("overtimeAfterMins", overtimeAfterMins);
    formData.set("workDays", workDays.join(","));
    formData.set("isDefault", String(isDefault));
    formData.set("isActive", String(isActive));

    const result = existing?.id
      ? await updateShift(existing.id, formData)
      : await createShift(formData);

    setSaving(false);
    if ("error" in result) { setError(result.error ?? "Failed to save"); return; }
    router.push("/africs/hr/attendance/shifts");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Shift Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Shift" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: string | null) => { if (v) setType(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="rotating">Rotating</SelectItem>
                  <SelectItem value="open">Open (No fixed hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Break (mins)</Label>
              <Input type="number" min="0" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Grace Period (mins)</Label>
              <Input type="number" min="0" value={gracePeriodMins} onChange={(e) => setGracePeriodMins(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <Label>OT After (mins)</Label>
            <Input
              type="number"
              min="0"
              value={overtimeAfterMins}
              onChange={(e) => setOvertimeAfterMins(e.target.value)}
              placeholder="0 = overtime starts immediately after shift end"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Work Days</h3>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d) => (
              <label key={d.key} className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={workDays.includes(d.key)}
                  onCheckedChange={() => toggleDay(d.key)}
                />
                <span className="text-sm">{d.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Options</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
            <div>
              <span className="text-sm font-medium">Default shift</span>
              <p className="text-xs text-muted-foreground">Apply to employees with no specific shift assignment. Only one shift can be the default.</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
            <span className="text-sm font-medium">Active</span>
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : existing?.id ? "Update Shift" : "Create Shift"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/africs/hr/attendance/shifts")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
