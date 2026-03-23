"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FolderKanban,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { getCrossProjectDashboard } from "@/lib/actions/project-reports";

interface ProjectStat {
  projectId: string;
  projectName: string;
  projectSlug: string;
  status: string;
  priority: string;
  client: string | null;
  progress: number;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  totalTimeMinutes: number;
  budgetAmount: number | null;
  hourlyRate: number | null;
  billingType: string | null;
  budgetCurrency: string | null;
  memberCount: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
}

interface Summary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalAllTasks: number;
  totalDoneTasks: number;
  totalOverdue: number;
  totalTrackedMinutes: number;
  estimatedRevenue: number;
}

interface Props {
  tenantId: string;
  onProjectClick?: (slug: string) => void;
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-500",
  in_progress: "bg-blue-500",
  on_hold: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export function ProjectReports({ tenantId, onProjectClick }: Props) {
  const [projects, setProjects] = useState<ProjectStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getCrossProjectDashboard(tenantId);
      setProjects(data.projects);
      setSummary(data.summary);
      setLoading(false);
    })();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-muted rounded" />)}</div>
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{summary.totalProjects}</p>
                <p className="text-xs text-muted-foreground">
                  Total Projects ({summary.activeProjects} active)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{summary.totalDoneTasks}</p>
                <p className="text-xs text-muted-foreground">
                  Tasks Done (of {summary.totalAllTasks})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{formatHours(summary.totalTrackedMinutes)}</p>
                <p className="text-xs text-muted-foreground">Time Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${summary.totalOverdue > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                <AlertTriangle className={`h-4 w-4 ${summary.totalOverdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`text-2xl font-semibold ${summary.totalOverdue > 0 ? "text-red-500" : ""}`}>
                  {summary.totalOverdue}
                </p>
                <p className="text-xs text-muted-foreground">Overdue Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue */}
      {summary.estimatedRevenue > 0 && (
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-semibold">{formatCurrency(summary.estimatedRevenue)}</p>
              <p className="text-xs text-muted-foreground">Estimated Revenue (billable projects)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            All Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2 font-medium">Project</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Progress</th>
                  <th className="text-right py-2 font-medium">Tasks</th>
                  <th className="text-right py-2 font-medium">Overdue</th>
                  <th className="text-right py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.projectId}
                    className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onProjectClick?.(p.projectSlug)}
                  >
                    <td className="py-2">
                      <div>
                        <p className="font-medium">{p.projectName}</p>
                        {p.client && (
                          <p className="text-xs text-muted-foreground">{p.client}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        <div className={`h-1.5 w-1.5 rounded-full mr-1 ${STATUS_COLORS[p.status] ?? "bg-gray-500"}`} />
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono text-xs">
                      {p.doneTasks}/{p.totalTasks}
                    </td>
                    <td className="py-2 text-right">
                      {p.overdueTasks > 0 ? (
                        <span className="text-xs text-red-500 font-mono">{p.overdueTasks}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-xs font-mono">
                      {p.totalTimeMinutes > 0 ? formatHours(p.totalTimeMinutes) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
