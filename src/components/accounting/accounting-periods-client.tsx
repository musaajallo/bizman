"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Lock, Unlock, XCircle, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  createAccountingPeriod,
  closePeriod,
  lockPeriod,
  reopenPeriod,
} from "@/lib/actions/accounting/periods";
import { cn } from "@/lib/utils";

type Period = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  fiscalYear: number;
  status: string;
  _count: { journalEntries: number };
};

const STATUS_STYLES: Record<string, string> = {
  open:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  locked: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function CurrentPeriodCard({ periods }: { periods: Period[] }) {
  const current = periods.find(p => p.status === "open");
  if (!current) return null;

  const now       = Date.now();
  const start     = new Date(current.startDate).getTime();
  const end       = new Date(current.endDate).getTime();
  const total     = end - start;
  const elapsed   = Math.max(0, now - start);
  const pct       = Math.min(100, Math.round((elapsed / total) * 100));
  const daysLeft  = Math.max(0, Math.ceil((end - now) / 86_400_000));

  const urgency =
    daysLeft <= 3  ? "text-destructive" :
    daysLeft <= 7  ? "text-amber-400"   :
    "text-emerald-500";

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Current Period</p>
              <p className="font-semibold text-sm">{current.name}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(current.startDate)} – {fmt(current.endDate)}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold tabular-nums ${urgency}`}>{daysLeft}</p>
            <p className="text-xs text-muted-foreground">days remaining</p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Progress value={pct} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">{pct}% elapsed</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountingPeriodsClient({ periods }: { periods: Period[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "close" | "lock" | "reopen" } | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAccountingPeriod(fd);
      if ("error" in result) { alert(result.error); return; }
      setAddOpen(false);
      router.refresh();
    });
  }

  function handleAction() {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    startTransition(async () => {
      let result: { error?: string } | { success: boolean } | undefined;
      if (action === "close")  result = await closePeriod(id);
      if (action === "lock")   result = await lockPeriod(id);
      if (action === "reopen") result = await reopenPeriod(id);
      if (result && "error" in result) { alert(result.error); }
      setConfirmAction(null);
      router.refresh();
    });
  }

  const actionLabel = { close: "Close", lock: "Lock", reopen: "Reopen" };
  const actionDesc: Record<string, string> = {
    close:  "Closing prevents new journal entries. You can reopen it later.",
    lock:   "Locking permanently prevents any changes. This cannot be undone.",
    reopen: "Reopening allows new journal entries to be posted to this period.",
  };

  return (
    <div className="space-y-4">
      <CurrentPeriodCard periods={periods} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {periods.length} period{periods.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />New Period
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Fiscal Year</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No accounting periods yet. Create one to start posting transactions.
                </TableCell>
              </TableRow>
            )}
            {periods.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmt(p.startDate)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmt(p.endDate)}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{p.fiscalYear}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{p._count.journalEntries}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs capitalize", STATUS_STYLES[p.status])}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {p.status === "open" && (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => setConfirmAction({ id: p.id, action: "close" })}>
                          <XCircle className="h-4 w-4 mr-2" />Close Period
                        </DropdownMenuItem>
                      )}
                      {p.status === "closed" && (
                        <>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setConfirmAction({ id: p.id, action: "reopen" })}>
                            <Unlock className="h-4 w-4 mr-2" />Reopen
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => setConfirmAction({ id: p.id, action: "lock" })}>
                            <Lock className="h-4 w-4 mr-2" />Lock Period
                          </DropdownMenuItem>
                        </>
                      )}
                      {p.status === "locked" && (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          <Lock className="h-4 w-4 mr-2" />Locked
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Period dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Accounting Period</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" placeholder="e.g. March 2026" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date <span className="text-destructive">*</span></Label>
                <Input id="endDate" name="endDate" type="date" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm action dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              {confirmAction ? actionLabel[confirmAction.action] : ""} Period
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction ? actionDesc[confirmAction.action] : ""}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.action === "lock" ? "destructive" : "default"}
              disabled={isPending}
              onClick={handleAction}
            >
              {confirmAction ? actionLabel[confirmAction.action] : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
