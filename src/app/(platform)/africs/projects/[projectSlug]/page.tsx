"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Users, Calendar, DollarSign, Flag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getTasksByProject } from "@/lib/actions/tasks";
import { getMilestones } from "@/lib/actions/milestones";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { StatusBadge } from "@/components/projects/status-badge";
import { PriorityIndicator } from "@/components/projects/priority-indicator";
import { ProjectProgress } from "@/components/projects/project-progress";
import { MemberAvatarGroup } from "@/components/projects/member-avatar-group";
import { TaskRow } from "@/components/projects/task-row";
import { QuickAddTask } from "@/components/projects/quick-add-task";
import { TaskDetailSheet } from "@/components/projects/task-detail-sheet";
import { BulkActionsBar } from "@/components/projects/bulk-actions-bar";
import { ViewSwitcher } from "@/components/projects/view-switcher";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";

type Project = Awaited<ReturnType<typeof getProjectBySlug>>;
type Task = Awaited<ReturnType<typeof getTasksByProject>>[number];
type Milestone = Awaited<ReturnType<typeof getMilestones>>[number];

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const milestoneStatusColor: Record<string, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-blue-500",
  completed: "text-emerald-500",
  delayed: "text-amber-500",
};

export default function ProjectDetailPage() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;

    const p = await getProjectBySlug(owner.id, params.projectSlug);
    if (!p) {
      router.push("/africs/projects");
      return;
    }

    setProject(p);
    const [t, m] = await Promise.all([
      getTasksByProject(p.id),
      getMilestones(p.id),
    ]);
    setTasks(t);
    setMilestones(m);
    setLoading(false);
  }, [params.projectSlug, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !project) {
    return (
      <div>
        <TopBar title="Loading..." subtitle="" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const clientLabel = project.clientTenant?.name ?? project.contactName ?? null;

  // Group tasks by milestone
  const tasksByMilestone: Record<string, Task[]> = {};
  const unassignedTasks: Task[] = [];

  for (const task of tasks) {
    if (task.milestoneId) {
      if (!tasksByMilestone[task.milestoneId]) tasksByMilestone[task.milestoneId] = [];
      tasksByMilestone[task.milestoneId].push(task);
    } else {
      unassignedTasks.push(task);
    }
  }

  // Compute completed task counts per milestone
  const doneGroups = new Set(project.statuses.filter((s) => s.group === "done" || s.group === "closed").map((s) => s.id));
  const completedTaskCountByMilestone: Record<string, number> = {};
  for (const [mId, mTasks] of Object.entries(tasksByMilestone)) {
    completedTaskCountByMilestone[mId] = mTasks.filter((t) => doneGroups.has(t.statusId)).length;
  }

  const allDisplayedTasks = [...tasks];

  function renderTaskGroup(groupTasks: Task[], milestoneId?: string) {
    return (
      <div>
        <div className="px-4 py-2 border-b">
          <QuickAddTask projectId={project!.id} milestoneId={milestoneId} onAdded={loadData} />
        </div>
        {groupTasks.length === 0 ? (
          <div className="py-5 text-center text-xs text-muted-foreground">No tasks yet.</div>
        ) : (
          <div>
            {groupTasks.map((task) => (
              <div key={task.id} className="flex items-center">
                <div className="pl-4 flex items-center">
                  <Checkbox
                    checked={selectedIds.includes(task.id)}
                    onCheckedChange={(checked) => {
                      setSelectedIds((prev) =>
                        checked ? [...prev, task.id] : prev.filter((id) => id !== task.id)
                      );
                    }}
                    className="h-3.5 w-3.5"
                  />
                </div>
                <div className="flex-1">
                  <TaskRow
                    task={task}
                    statuses={project!.statuses}
                    onDeleted={loadData}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle={clientLabel ? `Client: ${clientLabel}` : "Internal project"}
        actions={
          <div className="flex items-center gap-2">
            <ViewSwitcher currentView="list" baseUrl={`/africs/projects/${project.slug}`} showTimeline showCalendar showTime showOverview />
            <Link href={`/africs/projects/${project.slug}/settings`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{statusLabels[project.status] ?? project.status}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <PriorityIndicator priority={project.priority} showLabel />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasks</span>
                <span className="text-sm font-medium">{tasks.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-mono">{project.progress}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {project.members.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <MemberAvatarGroup members={project.members} />
            </div>
          )}
          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {project.startDate && <span>{new Date(project.startDate).toLocaleDateString()}</span>}
              {project.startDate && project.endDate && <span>&ndash;</span>}
              {project.endDate && !project.isRolling && <span>{new Date(project.endDate).toLocaleDateString()}</span>}
              {project.isRolling && <span>Rolling</span>}
            </div>
          )}
          {project.budgetAmount && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{project.budgetCurrency} {Number(project.budgetAmount).toLocaleString()}</span>
            </div>
          )}
          {project.category && (
            <Badge variant="secondary" className="text-xs">{project.category.name}</Badge>
          )}
          <Badge variant="secondary" className="text-xs capitalize">{project.type}</Badge>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>
        )}

        <ProjectProgress value={project.progress} />

        {/* Milestone sections */}
        {milestones.length > 0 && (
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const milestoneTasks = tasksByMilestone[milestone.id] ?? [];
              return (
                <Card key={milestone.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Flag className={`h-4 w-4 shrink-0 ${milestoneStatusColor[milestone.status] ?? "text-muted-foreground"}`} />
                      <CardTitle className="text-base">{milestone.name}</CardTitle>
                      {milestone.payment?.invoiceId && milestone.payment.invoice?.status !== "void" && (
                        <Badge variant="outline" className="text-xs ml-auto capitalize">
                          {milestone.payment.invoice?.status}
                        </Badge>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground ml-6">{milestone.description}</p>
                    )}
                    {milestone.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-6">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(milestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {renderTaskGroup(milestoneTasks, milestone.id)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Unassigned / general tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {milestones.length > 0 ? "Unassigned Tasks" : "Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Select all (only for unassigned section) */}
            {unassignedTasks.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-1.5 border-b bg-muted/30">
                <Checkbox
                  checked={selectedIds.length === allDisplayedTasks.length && allDisplayedTasks.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? allDisplayedTasks.map((t) => t.id) : []);
                  }}
                  className="h-3.5 w-3.5"
                />
                <span className="text-[10px] text-muted-foreground">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
                </span>
              </div>
            )}
            {renderTaskGroup(unassignedTasks)}
          </CardContent>
        </Card>

        <BulkActionsBar
          selectedIds={selectedIds}
          statuses={project.statuses}
          members={project.members.map((m) => ({ id: m.user.id, name: m.user.name }))}
          onClear={() => setSelectedIds([])}
          onUpdated={() => { setSelectedIds([]); loadData(); }}
        />

        {project.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <TaskDetailSheet
        taskId={selectedTaskId}
        projectId={project.id}
        statuses={project.statuses}
        projectMembers={project.members}
        currentUserId={session?.user?.id ?? ""}
        open={!!selectedTaskId}
        onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}
        onUpdated={loadData}
      />
    </div>
  );
}
