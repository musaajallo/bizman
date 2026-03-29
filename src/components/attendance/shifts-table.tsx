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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreHorizontal, Trash2, Pencil, Star } from "lucide-react";
import Link from "next/link";
import { deleteShift } from "@/lib/actions/attendance";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

interface Shift {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  gracePeriodMins: number;
  overtimeAfterMins: number;
  workDays: string[];
  isDefault: boolean;
  isActive: boolean;
  _count: { assignments: number; logs: number };
}

interface Props {
  shifts: Shift[];
}

export function ShiftsTable({ shifts }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deletingId) return;
    await deleteShift(deletingId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Work Days</TableHead>
              <TableHead>Break</TableHead>
              <TableHead>Grace</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                  No shifts configured. Create your first shift to get started.
                </TableCell>
              </TableRow>
            )}
            {shifts.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {s.isDefault && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{s.type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {s.startTime} – {s.endTime}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 flex-wrap">
                    {["mon","tue","wed","thu","fri","sat","sun"].map((d) => (
                      <span
                        key={d}
                        className={`text-xs px-1 py-0.5 rounded font-medium ${
                          s.workDays.includes(d)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground/40"
                        }`}
                      >
                        {DAY_LABELS[d]}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.breakMinutes}m</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.gracePeriodMins}m</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s._count.assignments}</TableCell>
                <TableCell>
                  <Badge variant={s.isActive ? "default" : "secondary"} className="text-xs">
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href={`/africs/hr/attendance/shifts/${s.id}/edit`} />}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingId(s.id)}
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

      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the shift and remove all its assignments. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
