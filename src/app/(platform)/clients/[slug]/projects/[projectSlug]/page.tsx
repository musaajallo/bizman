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
import { PriorityIndicator } from "@/components/projects/priority-indicator";
import { ProjectProgress } from "@/components/projects/project-progress";
import { MemberAvatarGroup } from "@/components/projects/member-avatar-group";
import { TaskRow } from "@/components/projects/task-row";
import { QuickAddTask } from "@/components/projects/quick-add-task";
import { TaskDetailSheet } from "@/components/projects/task-detail-sheet";
import { ViewSwitcher } from "@/components/projects/view-switcher";
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

export default function ClientProjectDetailPage() {
  const params = useParams<{ slug: string; projectSlug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;

    const p = await getProjectBySlug(owner.id, params.projectSlug);
    if (!p) {
      router.push(`/clients/${params.slug}/projects`);
      return;
    }

    setProject(p);
    const t = await getTasksByProject(p.id);
    setTasks(t);
    setLoading(false);
  }, [params.projectSlug, params.slug, router]);

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

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle={project.clientTenant?.name ?? ""}
        actions={
          <div className="flex items-center gap-2">
            <ViewSwitcher currentView="list" baseUrl={`/clients/${params.slug}/projects/${project.slug}`} showTimeline showCalendar showTime showOverview />
            <Link
              href={`/clients/${params.slug}/projects/${project.slug}/settings`}
            >
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
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    statuses={project.statuses}
                    onDeleted={loadData}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
