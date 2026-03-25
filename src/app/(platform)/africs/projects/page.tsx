import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, BarChart3, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getProjects } from "@/lib/actions/projects";
import { notFound } from "next/navigation";
import { PriorityIndicator } from "@/components/projects/priority-indicator";
import { ProjectProgress } from "@/components/projects/project-progress";
import { MemberAvatarGroup } from "@/components/projects/member-avatar-group";
import { ViewSwitcher } from "@/components/projects/view-switcher";

const statusColors: Record<string, string> = {
  not_started: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  on_hold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const projects = await getProjects(owner.id);
  const { view } = await searchParams;
  const isListView = view === "list";

  return (
    <div>
      <TopBar
        title="Projects"
        subtitle="All projects across clients"
        actions={
          <div className="flex items-center gap-2">
            <ViewSwitcher
              currentView={isListView ? "list" : "cards"}
              baseUrl="/africs/projects"
              showCards
            />
            <Link href="/africs/projects/templates">
              <Button size="sm" variant="outline" className="gap-2">
                <Copy className="h-3.5 w-3.5" />
                Templates
              </Button>
            </Link>
            <Link href="/africs/projects/reports">
              <Button size="sm" variant="outline" className="gap-2">
                <BarChart3 className="h-3.5 w-3.5" />
                Reports
              </Button>
            </Link>
            <Link href="/africs/projects/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-12">
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
            </CardContent>
          </Card>
        ) : isListView ? (
          /* ── Table / List view ── */
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Progress</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Due</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Tasks</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Team</th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.slug} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PriorityIndicator priority={project.priority} />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          {project.category && (
                            <p className="text-xs text-muted-foreground">{project.category.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                      {project.clientTenant?.name ?? project.contactName ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="outline" className={`text-xs ${statusColors[project.status] ?? statusColors.not_started}`}>
                        {statusLabels[project.status] ?? project.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground font-mono">
                      {project.isRolling ? "Ongoing" : project.endDate ? project.endDate.toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs font-mono text-muted-foreground">
                      {project._count.tasks}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <MemberAvatarGroup members={project.members} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/africs/projects/${project.slug}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Cards view ── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.slug} href={`/africs/projects/${project.slug}`}>
                <Card className="transition-colors hover:border-primary/50 cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <PriorityIndicator priority={project.priority} />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={statusColors[project.status] ?? statusColors.not_started}
                        >
                          {statusLabels[project.status] ?? project.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {project.type}
                        </Badge>
                      </div>

                      {project.clientTenant && (
                        <p className="text-sm text-muted-foreground">
                          {project.clientTenant.name}
                        </p>
                      )}
                      {project.contactName && !project.clientTenant && (
                        <p className="text-sm text-muted-foreground">
                          {project.contactName}
                        </p>
                      )}
                      {project.category && (
                        <Badge variant="outline" className="text-xs">
                          {project.category.name}
                        </Badge>
                      )}

                      <ProjectProgress value={project.progress} />

                      <div className="flex items-center justify-between pt-1">
                        <MemberAvatarGroup members={project.members} />
                        <span className="text-xs text-muted-foreground">
                          {project._count.tasks} tasks
                        </span>
                      </div>

                      {project.endDate && !project.isRolling && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Due {project.endDate.toLocaleDateString()}
                        </p>
                      )}
                      {project.isRolling && (
                        <p className="text-xs text-muted-foreground">Rolling / Ongoing</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
