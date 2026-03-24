"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OvertimeStatusBadge } from "./overtime-status-badge";
import { OvertimeTypeBadge } from "./overtime-type-badge";
import { OvertimeReviewDialog } from "./overtime-review-dialog";
import { OVERTIME_STATUSES } from "@/lib/overtime-constants";
import { Eye } from "lucide-react";

interface Request {
  id: string;
  date: string;
  hours: number;
  overtimeType: string;
  reason: string;
  status: string;
  employee: { id: string; firstName: string; lastName: string; department: string | null; jobTitle: string | null; photoUrl: string | null };
  reviewer: { id: string; firstName: string; lastName: string } | null;
  project: { id: string; name: string } | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export function OvertimeRequestTable({ requests }: { requests: Request[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reviewing, setReviewing] = useState<Request | null>(null);

  const filtered = requests.filter((r) => {
    const name = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !r.reason.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (typeFilter && r.overtimeType !== typeFilter) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search employee or reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v === "all" ? "" : v); }}>
          <SelectTrigger className="h-8 text-sm w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {OVERTIME_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value || "all"}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v === "all" ? "" : v); }}>
          <SelectTrigger className="h-8 text-sm w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="standard">Standard (Weekday)</SelectItem>
            <SelectItem value="weekend">Weekend</SelectItem>
            <SelectItem value="holiday">Public Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-sm">No overtime requests found.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
                <TableHead className="hidden lg:table-cell">Reviewer</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const dateLabel = new Date(r.date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
                });
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{r.employee.firstName} {r.employee.lastName}</div>
                      {r.employee.department && (
                        <div className="text-xs text-muted-foreground">{r.employee.department}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{dateLabel}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{r.hours}h</TableCell>
                    <TableCell><OvertimeTypeBadge overtimeType={r.overtimeType} /></TableCell>
                    <TableCell><OvertimeStatusBadge status={r.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-48 truncate">
                      {r.reason}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "pending" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setReviewing(r)}
                        >
                          <Eye className="h-3 w-3" />Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {reviewing && (
        <OvertimeReviewDialog request={reviewing} onClose={() => setReviewing(null)} />
      )}
    </>
  );
}
