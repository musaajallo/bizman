"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewOvertimeRequest } from "@/lib/actions/overtime";
import { CheckCircle, XCircle } from "lucide-react";

interface Request {
  id: string;
  employee: { firstName: string; lastName: string };
  date: string;
  hours: number;
  overtimeType: string;
  reason: string;
}

interface Props {
  request: Request;
  onClose: () => void;
}

export function OvertimeReviewDialog({ request, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleReview(action: "approved" | "rejected") {
    setDecision(action);
    setError(null);
  }

  function handleConfirm() {
    if (!decision) return;
    setError(null);
    startTransition(async () => {
      const result = await reviewOvertimeRequest(request.id, decision, reviewNote || undefined);
      if (result && "error" in result) {
        setError(result.error ?? "Error");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const employeeName = `${request.employee.firstName} ${request.employee.lastName}`;
  const dateLabel = new Date(request.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Overtime Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee</span>
              <span className="font-medium">{employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{dateLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hours</span>
              <span className="font-mono">{request.hours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{request.overtimeType}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Reason</span>
              <span className="text-right">{request.reason}</span>
            </div>
          </div>

          {!decision ? (
            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleReview("approved")}
              >
                <CheckCircle className="h-3.5 w-3.5" />Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleReview("rejected")}
              >
                <XCircle className="h-3.5 w-3.5" />Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {decision === "approved" ? (
                  <span className="text-emerald-400">Approving this request</span>
                ) : (
                  <span className="text-destructive">Rejecting this request</span>
                )}
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs ml-auto" onClick={() => setDecision(null)}>
                  Change
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">
                  {decision === "rejected" ? "Rejection reason *" : "Notes (optional)"}
                </Label>
                <Textarea
                  id="note"
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={decision === "rejected" ? "Explain why this request is being rejected…" : "Optional notes for the employee…"}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          {decision && (
            <Button
              variant={decision === "rejected" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isPending}
              className={decision === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isPending ? "Please wait…" : decision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
