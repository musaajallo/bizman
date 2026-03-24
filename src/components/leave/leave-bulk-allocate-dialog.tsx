"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bulkAllocateLeaveBalances } from "@/lib/actions/leave";
import { LEAVE_TYPES } from "@/lib/leave-types";

interface Props {
  year: number;
  onClose: () => void;
}

export function LeaveBulkAllocateDialog({ year, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const leaveType = fd.get("leaveType") as string;
    const allocated = parseInt(fd.get("allocated") as string);
    if (!leaveType || isNaN(allocated) || allocated < 0) {
      setError("Please fill all fields correctly");
      return;
    }
    startTransition(async () => {
      const res = await bulkAllocateLeaveBalances(year, leaveType, allocated);
      if ("error" in res) {
        setError(res.error ?? "An error occurred");
      } else if ("count" in res) {
        setResult({ count: res.count });
        router.refresh();
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Bulk Allocate Leave — {year}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-emerald-400 font-medium">Done!</p>
            <p className="text-sm text-muted-foreground">
              Allocated to {result.count} employee{result.count !== 1 ? "s" : ""}.
            </p>
            <Button onClick={onClose} className="mt-2">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the same leave allocation for all active employees. Existing values will be overwritten.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="leaveType">Leave Type</Label>
              <select
                id="leaveType"
                name="leaveType"
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select type…</option>
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allocated">Days Allocated</Label>
              <Input id="allocated" name="allocated" type="number" min={0} max={365} defaultValue={21} className="h-9" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Allocating…" : "Allocate"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
