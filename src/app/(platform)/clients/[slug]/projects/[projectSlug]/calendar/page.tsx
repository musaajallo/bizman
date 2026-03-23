"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getTasksByProject } from "@/lib/actions/tasks";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { TaskCalendar } from "@/components/projects/task-calendar";
import { TaskDetailSheet } from "@/components/projects/task-detail-sheet";
import { ViewSwitcher } from "@/components/projects/view-switcher";
import { useSession } from "next-auth/react";

type Project = Awaited<ReturnType<typeof getProjectBySlug>>;
type Task = Awaited<ReturnType<typeof getTasksByProject>>[number];

export default function ClientCalendarPage() {
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
    if (!p) { router.push(`/clients/${params.slug}/projects`); return; }
    setProject(p);
    const t = await getTasksByProject(p.id);
    setTasks(t);
    setLoading(false);
  }, [params.projectSlug, params.slug, router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !project) {
    return (
      <div>
        <TopBar title="Loading..." subtitle="" />
        <div className="p-6"><div className="animate-pulse h-96 bg-muted rounded" /></div>
      </div>
    );
  }

  const baseUrl = `/clients/${params.slug}/projects/${project.slug}`;

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle={project.clientTenant?.name ?? ""}
        actions={
          <div className="flex items-center gap-2">
            <ViewSwitcher currentView="calendar" baseUrl={baseUrl} showTimeline showCalendar showTime showOverview />
            <Link href={`${baseUrl}/settings`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Settings className="h-3.5 w-3.5" />Settings
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <TaskCalendar
              tasks={tasks}
              onTaskClick={(id) => setSelectedTaskId(id)}
            />
          </CardContent>
        </Card>
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
