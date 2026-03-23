import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployees, getEmployeeStats } from "@/lib/actions/employees";
import { notFound } from "next/navigation";
import { EmployeeListTable } from "@/components/employees/employee-list-table";

export default async function EmployeesPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [employees, stats] = await Promise.all([
    getEmployees(owner.id),
    getEmployeeStats(owner.id),
  ]);

  return (
    <div>
      <TopBar
        title="Employees"
        subtitle="Employee directory and profiles"
        actions={
          <Link href="/africs/hr/employees/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Employee
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Active", value: stats.active, color: "text-emerald-400" },
            { label: "On Leave", value: stats.onLeave, color: "text-amber-400" },
            { label: "Terminated", value: stats.terminated, color: "text-zinc-500" },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold font-display mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <EmployeeListTable
          employees={employees}
          accentColor={owner.accentColor ?? owner.primaryColor}
        />
      </div>
    </div>
  );
}
