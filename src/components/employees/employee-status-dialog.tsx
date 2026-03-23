"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateEmployeeStatus } from "@/lib/actions/employees";

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "study", label: "Study Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
];

interface Props {
  employeeId: string;
  targetStatus: "on_leave" | "terminated" | "resigned" | "suspended" | "active" | null;
  onClose: () => void;
}

export function EmployeeStatusDialog({ employeeId, targetStatus, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaveType, setLeaveType] = useState("annual");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [reason, setReason] = useState("");

  if (!targetStatus) return null;

  function handleConfirm() {
    if (!targetStatus) return;
    startTransition(() => {
      void updateEmployeeStatus(employeeId, targetStatus, {
        leaveType: targetStatus === "on_leave" ? leaveType : undefined,
        leaveEndDate: targetStatus === "on_leave" ? leaveEndDate : undefined,
        terminationReason: targetStatus === "terminated" || targetStatus === "resigned" ? reason : undefined,
      }).then(() => {
        onClose();
        router.refresh();
      });
    });
  }

  const isLeave = targetStatus === "on_leave";
  const isExit = targetStatus === "terminated" || targetStatus === "resigned";

  const titles: Record<string, string> = {
    on_leave: "Place on Leave",
    terminated: "Terminate Employee",
    resigned: "Record Resignation",
    suspended: "Suspend Employee",
    active: "Activate Employee",
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{titles[targetStatus]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLeave && (
            <>
              <div className="space-y-1.5">
                <Label>Leave Type</Label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Expected Return Date <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </>
          )}

          {isExit && (
            <div className="space-y-1.5">
              <Label>
                {targetStatus === "terminated" ? "Reason for Termination" : "Reason for Resignation"}
                {" "}<span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={targetStatus === "terminated" ? "e.g. Redundancy, misconduct…" : "e.g. Better opportunity, personal reasons…"}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {!isLeave && !isExit && (
            <p className="text-sm text-muted-foreground">
              {targetStatus === "active" ? "This employee will be marked as active." : "This employee will be suspended."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={pending}
            variant={targetStatus === "terminated" ? "destructive" : "default"}
          >
            {pending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
