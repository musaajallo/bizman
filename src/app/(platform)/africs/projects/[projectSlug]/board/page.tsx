"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getTasksByStatus, updateTaskStatus } from "@/lib/actions/tasks";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { TaskCard } from "@/components/projects/task-card";
import { TaskDetailSheet } from "@/components/projects/task-detail-sheet";
import { ViewSwitcher } from "@/components/projects/view-switcher";
import { QuickAddTask } from "@/components/projects/quick-add-task";
import { useSession } from "next-auth/react";

type Project = Awaited<ReturnType<typeof getProjectBySlug>>;
type StatusColumn = Awaited<ReturnType<typeof getTasksByStatus>>[number];

export default function BoardPage() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project>(null);
  const [columns, setColumns] = useState<StatusColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;

    const p = await getProjectBySlug(owner.id, params.projectSlug);
    if (!p) {
      router.push("/africs/projects");
      return;
    }

    setProject(p);
    const cols = await getTasksByStatus(p.id);
    setColumns(cols);
    setLoading(false);
  }, [params.projectSlug, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDrop(e: React.DragEvent, statusId: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    await updateTaskStatus(taskId, statusId);
    loadData();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  if (loading || !project) {
    return (
      <div>
        <TopBar title="Loading..." subtitle="" />
        <div className="p-6">
          <div className="animate-pulse flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-72 h-96 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = `/africs/projects/${project.slug}`;

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle={
          project.clientTenant?.name
            ? `Client: ${project.clientTenant.name}`
            : "Internal project"
        }
        actions={
          <div className="flex items-center gap-2">
            <ViewSwitcher currentView="board" baseUrl={baseUrl} showTimeline showCalendar showTime showOverview />
            <Link href={`${baseUrl}/settings`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className="w-72 shrink-0 flex flex-col"
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-sm font-medium">{col.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {col.tasks.length}
                </span>
              </div>

              {/* Column body */}
              <div className="space-y-2 flex-1 min-h-[200px] p-1 rounded-lg bg-muted/30 border border-dashed border-transparent hover:border-border transition-colors">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => setSelectedTaskId(task.id)}
                    />
                  </div>
                ))}

                {col.isDefault && (
                  <div className="px-1 pt-1">
                    <QuickAddTask projectId={project.id} onAdded={loadData} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
