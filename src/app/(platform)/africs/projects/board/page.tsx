"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getProjects, updateProjectStatus } from "@/lib/actions/projects";
import { ProjectBoardCard } from "@/components/projects/project-board-card";
import { ViewSwitcher } from "@/components/projects/view-switcher";

const PROJECT_STATUSES = [
  { key: "not_started", label: "Not Started", color: "#6B7280" },
  { key: "in_progress", label: "In Progress", color: "#3B82F6" },
  { key: "on_hold", label: "On Hold", color: "#F59E0B" },
  { key: "completed", label: "Completed", color: "#22C55E" },
  { key: "cancelled", label: "Cancelled", color: "#EF4444" },
];

type Project = Awaited<ReturnType<typeof getProjects>>[number];

export default function ProjectsBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;
    const p = await getProjects(owner.id);
    setProjects(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("text/plain");
    if (!projectId) return;
    await updateProjectStatus(projectId, status);
    loadData();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragStart(e: React.DragEvent, projectId: string) {
    e.dataTransfer.setData("text/plain", projectId);
    e.dataTransfer.effectAllowed = "move";
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Projects" subtitle="All projects across clients" />
        <div className="p-6">
          <div className="animate-pulse flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-64 h-96 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Projects"
        subtitle="All projects across clients"
        actions={
          <div className="flex items-center gap-2">
            <ViewSwitcher currentView="board" baseUrl="/africs/projects" />
            <Link href="/africs/projects/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first project to start tracking work.
            </p>
            <Link href="/africs/projects/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PROJECT_STATUSES.map((status) => {
              const columnProjects = projects.filter(
                (p) => p.status === status.key
              );
              return (
                <div
                  key={status.key}
                  className="w-72 shrink-0 flex flex-col"
                  onDrop={(e) => handleDrop(e, status.key)}
                  onDragOver={handleDragOver}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm font-medium">{status.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {columnProjects.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="space-y-2 flex-1 min-h-[200px] p-1 rounded-lg bg-muted/30 border border-dashed border-transparent hover:border-border transition-colors">
                    {columnProjects.map((project) => (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, project.id)}
                      >
                        <ProjectBoardCard
                          project={project}
                          baseUrl="/africs/projects"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
