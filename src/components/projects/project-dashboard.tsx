"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "./activity-feed";
import { MilestoneList } from "./milestone-list";
import {
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";

interface StatusCount {
  id: string;
  name: string;
  color: string;
  group: string;
  _count: { tasks: number };
}

interface OverdueTask {
  id: string;
  title: string;
  dueDate: Date | string;
  priority: string;
}

interface MilestoneData {
  id: string;
  name: string;
  description: string | null;
  dueDate: Date | string | null;
  status: string;
  completed: boolean;
  completedAt: Date | string | null;
  payment?: {
    amount: { toString(): string } | number | string;
    currency: string;
    description: string | null;
    triggerType: string;
    invoiceId: string | null;
    triggeredAt: Date | string | null;
    invoice: { id: string; invoiceNumber: string; status: string } | null;
  } | null;
  _count?: { tasks: number };
}

interface ActivityData {
  id: string;
  action: string;
  details: unknown;
  createdAt: Date | string;
  actor: { id: string; name: string | null; image: string | null };
}

interface ProjectDashboardProps {
  projectId: string;
  statuses: StatusCount[];
  overdue: number;
  totalTasks: number;
  doneTasks: number;
  progress: number;
  overdueTasks: OverdueTask[];
  milestones: MilestoneData[];
  activities: ActivityData[];
  onUpdated: () => void;
}

export function ProjectDashboard({
  projectId,
  statuses,
  overdue,
  totalTasks,
  doneTasks,
  progress,
  overdueTasks,
  milestones,
  activities,
  onUpdated,
}: ProjectDashboardProps) {
  const activeTasks = statuses
    .filter((s) => s.group === "active")
    .reduce((sum, s) => sum + s._count.tasks, 0);
  const notStartedTasks = statuses
    .filter((s) => s.group === "not_started")
    .reduce((sum, s) => sum + s._count.tasks, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ListChecks className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{doneTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
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
                <p className="text-2xl font-semibold">{activeTasks}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${overdue > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                <AlertTriangle className={`h-4 w-4 ${overdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`text-2xl font-semibold ${overdue > 0 ? "text-red-500" : ""}`}>
                  {overdue}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress + Status distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{progress}%</span>
                <span className="text-sm text-muted-foreground">
                  {doneTasks} of {totalTasks} tasks
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statuses.map((status) => {
                const pct =
                  totalTasks > 0
                    ? Math.round((status._count.tasks / totalTasks) * 100)
                    : 0;
                return (
                  <div key={status.id} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm flex-1">{status.name}</span>
                    <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                      {status._count.tasks}
                    </span>
                    <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {overdueTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{task.title}</span>
                  <span className="text-xs text-red-500 font-mono">
                    Due {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones + Activity side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneList
              projectId={projectId}
              milestones={milestones}
              onUpdated={onUpdated}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
