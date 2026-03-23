"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProjectBySlug, getProjectStats } from "@/lib/actions/projects";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getMilestones } from "@/lib/actions/milestones";
import { getProjectActivities } from "@/lib/actions/project-activity";
import { ProjectDashboard } from "@/components/projects/project-dashboard";
import { ViewSwitcher } from "@/components/projects/view-switcher";

type Project = Awaited<ReturnType<typeof getProjectBySlug>>;

export default function ClientOverviewPage() {
  const params = useParams<{ slug: string; projectSlug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getProjectStats>> | null>(null);
  const [milestones, setMilestones] = useState<Awaited<ReturnType<typeof getMilestones>>>([]);
  const [activities, setActivities] = useState<Awaited<ReturnType<typeof getProjectActivities>>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;
    const p = await getProjectBySlug(owner.id, params.projectSlug);
    if (!p) { router.push(`/clients/${params.slug}/projects`); return; }
    setProject(p);

    const [s, m, a] = await Promise.all([
      getProjectStats(p.id),
      getMilestones(p.id),
      getProjectActivities(p.id, 20),
    ]);
    setStats(s);
    setMilestones(m);
    setActivities(a);
    setLoading(false);
  }, [params.projectSlug, params.slug, router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !project || !stats) {
    return (
      <div>
        <TopBar title="Loading..." subtitle="" />
        <div className="p-6"><div className="animate-pulse space-y-4">
          <div className="grid gap-4 grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded" />)}</div>
          <div className="h-48 bg-muted rounded" />
        </div></div>
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
            <ViewSwitcher currentView="overview" baseUrl={baseUrl} showTimeline showCalendar showTime showOverview />
            <Link href={`${baseUrl}/settings`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Settings className="h-3.5 w-3.5" />Settings
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <ProjectDashboard
          projectId={project.id}
          statuses={stats.statuses}
          overdue={stats.overdue}
          totalTasks={stats.totalTasks}
          doneTasks={stats.doneTasks}
          progress={project.progress}
          overdueTasks={stats.overdueTasks.map(t => ({ ...t, dueDate: t.dueDate! }))}
          milestones={milestones}
          activities={activities}
          onUpdated={loadData}
        />
      </div>
    </div>
  );
}
