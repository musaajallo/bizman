"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, AlertCircle, Calendar } from "lucide-react";

interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  statusCounts: Record<string, number>;
  recentRecords: Array<{
    id: string;
    type: string;
    timestamp: Date | string;
    source: string;
    employee: { id: string; firstName: string; lastName: string; employeeNumber: string };
  }>;
}

interface Props {
  data: DashboardData | null;
}

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  late: "Late",
  weekend: "Weekend",
  holiday: "Holiday",
  unresolved: "Unresolved",
};

export function AttendanceDashboardCards({ data }: Props) {
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No attendance data available.
      </div>
    );
  }

  const attendancePct = data.totalEmployees > 0
    ? Math.round((data.presentToday / data.totalEmployees) * 100)
    : 0;

  const cards = [
    {
      label: "Total Employees",
      value: data.totalEmployees,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Present Today",
      value: data.presentToday,
      icon: UserCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      sub: `${attendancePct}% attendance`,
    },
    {
      label: "Absent Today",
      value: data.absentToday,
      icon: UserX,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Late Arrivals",
      value: data.statusCounts["late"] ?? 0,
      icon: AlertCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`p-2 rounded-lg ${c.bg} shrink-0`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {c.sub && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Today&apos;s Clock Events</h3>
            <span className="text-xs text-muted-foreground ml-auto">{data.recentRecords.length} records</span>
          </div>

          {data.recentRecords.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No clock events recorded today.
            </div>
          ) : (
            <div className="divide-y">
              {data.recentRecords.slice(0, 10).map((r) => (
                <div key={r.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${r.type === "clock_in" ? "bg-emerald-500" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{r.employee.firstName} {r.employee.lastName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{r.employee.employeeNumber}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium capitalize">{r.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize w-16 text-right">{r.source}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      {Object.keys(data.statusCounts).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Today&apos;s Status Distribution</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium tabular-nums">{count}</span>
                  <span className="text-muted-foreground">{STATUS_LABELS[status] ?? status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
