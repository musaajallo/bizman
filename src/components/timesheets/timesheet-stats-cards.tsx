import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

interface Stats {
  totalThisWeek: number;
  pendingApprovals: number;
  approvedThisWeek: number;
  avgWeeklyHours: number;
}

export function TimesheetStatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "This Week",        value: String(stats.totalThisWeek),             sub: "timesheets submitted",  icon: Clock,        color: "text-blue-400" },
    { label: "Pending Approval", value: String(stats.pendingApprovals),           sub: "awaiting review",       icon: AlertCircle,  color: "text-amber-400" },
    { label: "Approved",         value: String(stats.approvedThisWeek),           sub: "this week",             icon: CheckCircle,  color: "text-emerald-400" },
    { label: "Avg Hours/Week",   value: stats.avgWeeklyHours.toFixed(1),          sub: "across approved",       icon: TrendingUp,   color: "text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className={`text-xl font-bold font-mono ${c.color}`}>{c.value}</p>
          <p className="text-xs text-muted-foreground">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}
