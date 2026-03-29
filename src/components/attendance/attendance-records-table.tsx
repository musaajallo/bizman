"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Plus, RefreshCw } from "lucide-react";
import { deleteAttendanceRecord, processAttendanceForDate } from "@/lib/actions/attendance";
import { ManualEntryDialog } from "./manual-entry-dialog";

interface ClockRecord {
  id: string;
  type: string;
  method: string;
  source: string;
  isManual: boolean;
  timestamp: Date | string;
  note: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string; department: string | null };
  device: { id: string; name: string; type: string } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface Props {
  records: ClockRecord[];
  employees: Employee[];
}

const TYPE_COLORS: Record<string, string> = {
  clock_in: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  clock_out: "bg-red-500/10 text-red-600 border-red-500/20",
  break_start: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  break_end: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export function AttendanceRecordsTable({ records, employees }: Props) {
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handleDelete(id: string) {
    await deleteAttendanceRecord(id);
    router.refresh();
  }

  async function handleProcess() {
    setProcessing(true);
    const today = new Date().toISOString().split("T")[0];
    await processAttendanceForDate(today);
    setProcessing(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} records</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleProcess}
            disabled={processing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${processing ? "animate-spin" : ""}`} />
            {processing ? "Processing..." : "Process Today"}
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setManualOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Manual
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  No records found.
                </TableCell>
              </TableRow>
            )}
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{r.employee.firstName} {r.employee.lastName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.employee.employeeNumber}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[r.type] ?? "bg-secondary text-secondary-foreground border-border"}`}>
                    {r.type.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {new Date(r.timestamp).toLocaleString("en-US", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={r.isManual ? "outline" : "secondary"} className="text-xs capitalize">
                    {r.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.device?.name ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                  {r.note ?? "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ManualEntryDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        employees={employees}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
