"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { updateAttendanceLog } from "@/lib/actions/attendance";

interface Log {
  id: string;
  date: Date | string;
  status: string;
  hoursWorked: { toString(): string } | number | string | null;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeMinutes: number;
  actualClockIn: Date | string | null;
  actualClockOut: Date | string | null;
  notes: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string; department: string | null };
  shift: { id: string; name: string; startTime: string; endTime: string } | null;
}

interface Props {
  logs: Log[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  present:    { label: "Present",    variant: "default" },
  absent:     { label: "Absent",     variant: "destructive" },
  half_day:   { label: "Half Day",   variant: "outline" },
  late:       { label: "Late",       variant: "outline" },
  weekend:    { label: "Weekend",    variant: "secondary" },
  holiday:    { label: "Holiday",    variant: "secondary" },
  unresolved: { label: "Unresolved", variant: "secondary" },
};

function EditLogDialog({
  log,
  open,
  onOpenChange,
  onUpdated,
}: {
  log: Log;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(log.status);
  const [clockIn, setClockIn] = useState(
    log.actualClockIn ? new Date(log.actualClockIn).toISOString().slice(0, 16) : ""
  );
  const [clockOut, setClockOut] = useState(
    log.actualClockOut ? new Date(log.actualClockOut).toISOString().slice(0, 16) : ""
  );
  const [notes, setNotes] = useState(log.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateAttendanceLog(log.id, {
      status,
      actualClockIn: clockIn || undefined,
      actualClockOut: clockOut || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    onUpdated();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Log — {log.employee.firstName} {log.employee.lastName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {new Date(log.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: string | null) => { if (v) setStatus(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Clock In</Label>
              <Input type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Clock Out</Label>
              <Input type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes or corrections..."
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AttendanceLogsTable({ logs }: Props) {
  const router = useRouter();
  const [editingLog, setEditingLog] = useState<Log | null>(null);

  function fmtTime(dt: Date | string | null) {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{logs.length} log entries</p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Late</TableHead>
              <TableHead className="text-right">OT</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">
                  No logs found. Process attendance records to generate daily logs.
                </TableCell>
              </TableRow>
            )}
            {logs.map((l) => {
              const statusCfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.unresolved;
              const hours = l.hoursWorked ? parseFloat(l.hoursWorked.toString()).toFixed(1) : "—";
              return (
                <TableRow key={l.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{l.employee.firstName} {l.employee.lastName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{l.employee.employeeNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusCfg.variant} className="text-xs">{statusCfg.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.shift ? `${l.shift.name} (${l.shift.startTime}–${l.shift.endTime})` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{fmtTime(l.actualClockIn)}</TableCell>
                  <TableCell className="font-mono text-xs">{fmtTime(l.actualClockOut)}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">{hours}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {l.lateMinutes > 0 ? <span className="text-amber-600">{l.lateMinutes}m</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {l.overtimeMinutes > 0 ? <span className="text-blue-600">{l.overtimeMinutes}m</span> : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingLog(l)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingLog && (
        <EditLogDialog
          log={editingLog}
          open={!!editingLog}
          onOpenChange={(v) => { if (!v) setEditingLog(null); }}
          onUpdated={() => router.refresh()}
        />
      )}
    </div>
  );
}
