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
import { MoreHorizontal, Trash2, ExternalLink, CheckCircle, Send } from "lucide-react";
import Link from "next/link";
import { deleteBudget, updateBudgetStatus } from "@/lib/actions/budgets";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  submitted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface Budget {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  currency: string;
  status: string;
  _count: { lines: number };
}

export function BudgetsTable({ budgets }: { budgets: Budget[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteBudget(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleSubmit(id: string) {
    startTransition(async () => {
      await updateBudgetStatus(id, "submitted");
      router.refresh();
    });
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      await updateBudgetStatus(id, "approved");
      router.refresh();
    });
  }

  if (budgets.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No budgets created yet.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Lines</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((b) => (
            <TableRow key={b.id}>
              <TableCell>
                <Link href={`/africs/accounting/budgets/${b.id}`} className="font-medium hover:underline">
                  {b.name}
                </Link>
                {b.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{b.description}</p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(b.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                {" – "}
                {new Date(b.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className="font-mono text-sm">{b._count.lines}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${STATUS_STYLES[b.status] ?? ""}`}>
                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/africs/accounting/budgets/${b.id}`} />}>
                      <ExternalLink className="h-4 w-4 mr-2" /> View
                    </DropdownMenuItem>
                    {b.status === "draft" && (
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleSubmit(b.id)}>
                        <Send className="h-4 w-4 mr-2" /> Submit
                      </DropdownMenuItem>
                    )}
                    {b.status === "submitted" && (
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleApprove(b.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => setDeleteId(b.id)}
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
          <DialogHeader><DialogTitle>Delete Budget</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this budget and all its lines.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
