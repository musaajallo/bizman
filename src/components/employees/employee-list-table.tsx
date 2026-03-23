"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { EmployeeAvatar } from "./employee-avatar";
import { updateEmployeeStatus, deleteEmployee } from "@/lib/actions/employees";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, UserCheck, UserX, PauseCircle, Search } from "lucide-react";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  unit: string | null;
  employmentType: string;
  status: string;
  photoUrl: string | null;
  personalEmail: string | null;
}

interface Props {
  employees: Employee[];
  accentColor?: string | null;
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

const statusActions = [
  { status: "active", label: "Set Active", icon: UserCheck },
  { status: "on_leave", label: "Set On Leave", icon: PauseCircle },
  { status: "suspended", label: "Suspend", icon: UserX },
  { status: "terminated", label: "Terminate", icon: UserX },
];

export function EmployeeListTable({ employees, accentColor }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [, startTransition] = useTransition();

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))].sort() as string[];

  const filtered = employees.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (deptFilter && e.department !== deptFilter) return false;
    if (typeFilter && e.employmentType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        (e.jobTitle?.toLowerCase().includes(q) ?? false) ||
        (e.department?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  function handleStatusChange(id: string, status: string) {
    startTransition(() => {
      void updateEmployeeStatus(id, status);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this employee? This cannot be undone.")) return;
    startTransition(() => {
      void deleteEmployee(id).then(() => router.refresh());
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
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
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Types</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="intern">Intern</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Employee</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Department</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    No employees found
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="relative border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <Link href={`/africs/hr/employees/${emp.id}`} className="absolute inset-0" aria-label={`View ${emp.firstName} ${emp.lastName}`} />
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar
                          firstName={emp.firstName}
                          lastName={emp.lastName}
                          photoUrl={emp.photoUrl}
                          size="sm"
                          color={accentColor}
                        />
                        <div>
                          <p className="font-medium leading-tight">{emp.firstName} {emp.lastName}</p>
                          {emp.personalEmail && <p className="text-xs text-muted-foreground">{emp.personalEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">{emp.employeeNumber}</td>
                    <td className="py-3 px-4 text-muted-foreground">{emp.jobTitle || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{emp.department || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{typeLabels[emp.employmentType] || emp.employmentType}</td>
                    <td className="py-3 px-4"><EmployeeStatusBadge status={emp.status} /></td>
                    <td className="py-3 px-4 relative z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem render={<Link href={`/africs/hr/employees/${emp.id}/edit`} />}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {statusActions
                            .filter((a) => a.status !== emp.status)
                            .map((a) => (
                              <DropdownMenuItem key={a.status} onClick={() => handleStatusChange(emp.id, a.status)}>
                                <a.icon className="h-3.5 w-3.5 mr-2" />
                                {a.label}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(emp.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
