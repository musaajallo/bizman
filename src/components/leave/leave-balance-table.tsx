"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeaveTypeBadge } from "./leave-type-badge";
import { LeaveBulkAllocateDialog } from "./leave-bulk-allocate-dialog";
import { Search } from "lucide-react";

interface LeaveBalance {
  id: string;
  year: number;
  leaveType: string;
  allocated: number;
  used: number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string | null;
    jobTitle: string | null;
  };
}

interface Props {
  balances: LeaveBalance[];
  year: number;
}

export function LeaveBalanceTable({ balances, year }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const filtered = balances.filter((b) => {
    if (typeFilter && b.leaveType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        `${b.employee.firstName} ${b.employee.lastName}`.toLowerCase().includes(q) ||
        b.employee.employeeNumber.toLowerCase().includes(q) ||
        (b.employee.department?.toLowerCase().includes(q) ?? false)
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
        <Button size="sm" variant="outline" onClick={() => setShowBulk(true)} className="ml-auto">
          Bulk Allocate
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Employee</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Allocated</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Used</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Remaining</th>
                <th className="py-3 px-4 text-xs font-medium text-muted-foreground">Usage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    No leave balances found
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const remaining = b.allocated - b.used;
                  const pct = b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0;
                  return (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium leading-tight">{b.employee.firstName} {b.employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">{b.employee.employeeNumber}{b.employee.department ? ` · ${b.employee.department}` : ""}</p>
                      </td>
                      <td className="py-3 px-4"><LeaveTypeBadge leaveType={b.leaveType} /></td>
                      <td className="py-3 px-4 font-mono text-xs">{b.allocated}d</td>
                      <td className="py-3 px-4 font-mono text-xs">{b.used}d</td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className={remaining < 0 ? "text-destructive" : remaining === 0 ? "text-muted-foreground" : ""}>
                          {remaining}d
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-destructive" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showBulk && <LeaveBulkAllocateDialog year={year} onClose={() => setShowBulk(false)} />}
    </div>
  );
}
