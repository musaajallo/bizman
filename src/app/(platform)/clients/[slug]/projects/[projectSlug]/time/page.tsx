"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { TimeReport } from "@/components/projects/time-report";
import { ViewSwitcher } from "@/components/projects/view-switcher";

type Project = Awaited<ReturnType<typeof getProjectBySlug>>;

export default function ClientTimePage() {
  const params = useParams<{ slug: string; projectSlug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;
    const p = await getProjectBySlug(owner.id, params.projectSlug);
    if (!p) { router.push(`/clients/${params.slug}/projects`); return; }
    setProject(p);
    setLoading(false);
  }, [params.projectSlug, params.slug, router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !project) {
    return (
      <div>
        <TopBar title="Loading..." subtitle="" />
        <div className="p-6"><div className="animate-pulse h-48 bg-muted rounded" /></div>
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
            <ViewSwitcher currentView="time" baseUrl={baseUrl} showTimeline showCalendar showTime showOverview />
            <Link href={`${baseUrl}/settings`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Settings className="h-3.5 w-3.5" />Settings
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <TimeReport projectId={project.id} />
      </div>
    </div>
  );
}
