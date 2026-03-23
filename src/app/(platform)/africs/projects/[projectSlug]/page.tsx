"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Users, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getTasksByProject } from "@/lib/actions/tasks";
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

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function ProjectDetailPage() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
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
    const t = await getTasksByProject(p.id);
    setTasks(t);
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

  const clientLabel =
    project.clientTenant?.name ?? project.contactName ?? null;

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
        {/* Project summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">
                  {statusLabels[project.status] ?? project.status}
                </Badge>
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
              {project.startDate && (
                <span>{new Date(project.startDate).toLocaleDateString()}</span>
              )}
              {project.startDate && project.endDate && <span>&ndash;</span>}
              {project.endDate && !project.isRolling && (
                <span>{new Date(project.endDate).toLocaleDateString()}</span>
              )}
              {project.isRolling && <span>Rolling</span>}
            </div>
          )}
          {project.budgetAmount && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>
                {project.budgetCurrency}{" "}
                {Number(project.budgetAmount).toLocaleString()}
              </span>
            </div>
          )}
          {project.category && (
            <Badge variant="secondary" className="text-xs">
              {project.category.name}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs capitalize">
            {project.type}
          </Badge>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {project.description}
          </p>
        )}

        <ProjectProgress value={project.progress} />

        {/* Task list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-2 border-b">
              <QuickAddTask projectId={project.id} onAdded={loadData} />
            </div>

            {tasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No tasks yet. Add one above to get started.
              </div>
            ) : (
              <div>
                {/* Select all header */}
                <div className="flex items-center gap-2 px-4 py-1.5 border-b bg-muted/30">
                  <Checkbox
                    checked={selectedIds.length === tasks.length && tasks.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked ? tasks.map((t) => t.id) : []);
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
                  </span>
                </div>
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center">
                    <div className="pl-4 flex items-center">
                      <Checkbox
                        checked={selectedIds.includes(task.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, task.id]
                              : prev.filter((id) => id !== task.id)
                          );
                        }}
                        className="h-3.5 w-3.5"
                      />
                    </div>
                    <div className="flex-1">
                      <TaskRow
                        task={task}
                        statuses={project.statuses}
                        onDeleted={loadData}
                        onClick={() => setSelectedTaskId(task.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <BulkActionsBar
          selectedIds={selectedIds}
          statuses={project.statuses}
          members={project.members.map((m) => ({ id: m.user.id, name: m.user.name }))}
          onClear={() => setSelectedIds([])}
          onUpdated={() => { setSelectedIds([]); loadData(); }}
        />

        {/* Notes */}
        {project.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.notes}
              </p>
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
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
        onUpdated={loadData}
      />
    </div>
  );
}
