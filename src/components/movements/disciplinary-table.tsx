"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreHorizontal, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { deleteDisciplinaryRecord, acknowledgeDisciplinaryRecord, updateDisciplinaryStatus } from "@/lib/actions/movements";

const ACTION_LABELS: Record<string, string> = {
  verbal_warning: "Verbal Warning",
  written_warning: "Written Warning",
  final_written_warning: "Final Written Warning",
  suspension: "Suspension",
  termination: "Termination",
};

const ACTION_STYLES: Record<string, string> = {
  verbal_warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  written_warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  final_written_warning: "bg-red-500/10 text-red-400 border-red-500/20",
  suspension: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  termination: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  acknowledged: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  appealed: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface DisciplinaryRecord {
  id: string;
  actionType: string;
  incidentDate: string;
  incidentDescription: string;
  status: string;
  employeeAcknowledgement: boolean;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string };
}

export function DisciplinaryTable({ records }: { records: DisciplinaryRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteDisciplinaryRecord(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleAcknowledge(id: string) {
    startTransition(async () => {
      await acknowledgeDisciplinaryRecord(id);
      router.refresh();
    });
  }

  function handleClose(id: string) {
    startTransition(async () => {
      await updateDisciplinaryStatus(id, "closed");
      router.refresh();
    });
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No disciplinary records found.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Incident Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`/africs/hr/employees/${r.employee.id}`} className="font-medium hover:underline">
                  {r.employee.firstName} {r.employee.lastName}
                </Link>
                <div className="text-xs text-muted-foreground font-mono">{r.employee.employeeNumber}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${ACTION_STYLES[r.actionType] ?? ""}`}>
                  {ACTION_LABELS[r.actionType] ?? r.actionType}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(r.incidentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className="text-sm max-w-xs truncate text-muted-foreground">
                {r.incidentDescription}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${STATUS_STYLES[r.status] ?? ""}`}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {r.status === "pending" && (
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleAcknowledge(r.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Acknowledged
                      </DropdownMenuItem>
                    )}
                    {r.status !== "closed" && (
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleClose(r.id)}>
                        Close Record
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Disciplinary Record</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this record. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
