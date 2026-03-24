"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LeaveStatusBadge } from "./leave-status-badge";
import { LeaveTypeBadge } from "./leave-type-badge";
import { LeaveReviewDialog } from "./leave-review-dialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string | null;
  status: string;
  reviewNote: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string | null;
    jobTitle: string | null;
  };
  reviewedBy: { name: string | null; email: string } | null;
}

interface Props {
  requests: LeaveRequest[];
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function LeaveRequestTable({ requests }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState<LeaveRequest | null>(null);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (typeFilter && r.leaveType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(q) ||
        r.employee.employeeNumber.toLowerCase().includes(q) ||
        (r.employee.department?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="maternity">Maternity</option>
          <option value="paternity">Paternity</option>
          <option value="study">Study</option>
          <option value="unpaid">Unpaid</option>
          <option value="compassionate">Compassionate</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Employee</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Period</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Days</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Reason</th>
                <th className="py-3 px-4 w-24" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium leading-tight">{req.employee.firstName} {req.employee.lastName}</p>
                      <p className="text-xs text-muted-foreground">{req.employee.employeeNumber}{req.employee.department ? ` · ${req.employee.department}` : ""}</p>
                    </td>
                    <td className="py-3 px-4"><LeaveTypeBadge leaveType={req.leaveType} /></td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {fmt(req.startDate)} — {fmt(req.endDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{req.days}d</td>
                    <td className="py-3 px-4"><LeaveStatusBadge status={req.status} /></td>
                    <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell max-w-[200px] truncate">
                      {req.reason || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {req.status === "pending" && (
                        <button
                          onClick={() => setReviewTarget(req)}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Review
                        </button>
                      )}
                      {req.status === "approved" && (
                        <button
                          onClick={() => setReviewTarget(req)}
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {reviewTarget && (
        <LeaveReviewDialog
          request={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
