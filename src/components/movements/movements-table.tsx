"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreHorizontal, Trash2, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle, Building2 } from "lucide-react";
import Link from "next/link";
import { deleteStaffMovement } from "@/lib/actions/movements";

const TYPE_LABELS: Record<string, string> = {
  promotion: "Promotion",
  demotion: "Demotion",
  lateral: "Lateral Transfer",
  department_transfer: "Dept. Transfer",
  role_change: "Role Change",
};

const TYPE_STYLES: Record<string, string> = {
  promotion: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  demotion: "bg-red-500/10 text-red-400 border-red-500/20",
  lateral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  department_transfer: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  role_change: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  promotion: <ArrowUpCircle className="h-3.5 w-3.5" />,
  demotion: <ArrowDownCircle className="h-3.5 w-3.5" />,
  lateral: <ArrowRightCircle className="h-3.5 w-3.5" />,
  department_transfer: <Building2 className="h-3.5 w-3.5" />,
  role_change: <ArrowRightCircle className="h-3.5 w-3.5" />,
};

interface Movement {
  id: string;
  movementType: string;
  oldJobTitle: string | null;
  newJobTitle: string | null;
  oldDepartment: string | null;
  newDepartment: string | null;
  oldUnit: string | null;
  newUnit: string | null;
  effectiveDate: string;
  reason: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string };
}

export function MovementsTable({ movements }: { movements: Movement[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteStaffMovement(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  if (movements.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No staff movements recorded yet.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Effective Date</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => {
            const fromLabel = m.movementType === "department_transfer"
              ? [m.oldDepartment, m.oldUnit].filter(Boolean).join(" / ")
              : m.oldJobTitle ?? m.oldDepartment ?? "—";
            const toLabel = m.movementType === "department_transfer"
              ? [m.newDepartment, m.newUnit].filter(Boolean).join(" / ")
              : m.newJobTitle ?? m.newDepartment ?? "—";

            return (
              <TableRow key={m.id}>
                <TableCell>
                  <Link href={`/africs/hr/employees/${m.employee.id}`} className="font-medium hover:underline">
                    {m.employee.firstName} {m.employee.lastName}
                  </Link>
                  <div className="text-xs text-muted-foreground font-mono">{m.employee.employeeNumber}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`gap-1 text-xs ${TYPE_STYLES[m.movementType] ?? ""}`}>
                    {TYPE_ICONS[m.movementType]}
                    {TYPE_LABELS[m.movementType] ?? m.movementType}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{fromLabel}</TableCell>
                <TableCell className="text-sm font-medium">{toLabel}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.effectiveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Movement Record</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this movement record. The employee record will not be changed.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
