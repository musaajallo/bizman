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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LeaveTypeBadge } from "./leave-type-badge";
import { reviewLeaveRequest, cancelLeaveRequest } from "@/lib/actions/leave";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string | null;
  status: string;
  employee: { firstName: string; lastName: string; employeeNumber: string };
}

interface Props {
  request: LeaveRequest;
  onClose: () => void;
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function LeaveReviewDialog({ request, onClose }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCancellable = request.status === "approved";

  function handleAction(action: "approved" | "rejected" | "cancel") {
    setError(null);
    startTransition(async () => {
      let result;
      if (action === "cancel") {
        result = await cancelLeaveRequest(request.id);
      } else {
        result = await reviewLeaveRequest(request.id, action, note || undefined);
      }
      if ("error" in result) {
        setError(result.error ?? "An error occurred");
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCancellable ? "Cancel Leave" : "Review Leave Request"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{request.employee.firstName} {request.employee.lastName}</span>
              <LeaveTypeBadge leaveType={request.leaveType} />
            </div>
            <p className="text-muted-foreground">
              {fmt(request.startDate)} — {fmt(request.endDate)} ({request.days} business day{request.days !== 1 ? "s" : ""})
            </p>
            {request.reason && (
              <p className="text-muted-foreground italic">&ldquo;{request.reason}&rdquo;</p>
            )}
          </div>

          {!isCancellable && (
            <div className="space-y-1.5">
              <Label htmlFor="note">Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Add a note for the employee…"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isCancellable ? (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isPending}>Keep Leave</Button>
              <Button variant="destructive" onClick={() => handleAction("cancel")} disabled={isPending}>
                {isPending ? "Cancelling…" : "Cancel Leave"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isPending}>Dismiss</Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleAction("rejected")}
                disabled={isPending}
              >
                Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleAction("approved")}
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Approve"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
