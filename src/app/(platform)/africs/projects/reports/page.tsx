"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { ProjectReports } from "@/components/projects/project-reports";

export default function ReportsPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const owner = await getOwnerBusiness();
      if (!owner) return;
      setTenantId(owner.id);
      setLoading(false);
    })();
  }, []);

  if (loading || !tenantId) {
    return (
      <div>
        <TopBar title="Loading..." subtitle="" />
        <div className="p-6"><div className="animate-pulse space-y-4">
          <div className="grid gap-4 grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-muted rounded" />)}</div>
          <div className="h-64 bg-muted rounded" />
        </div></div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Project Reports"
        subtitle="Cross-project analytics and insights"
        actions={
          <Link href="/africs/projects">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Projects
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <ProjectReports
          tenantId={tenantId}
          onProjectClick={(slug) => router.push(`/africs/projects/${slug}/overview`)}
        />
      </div>
    </div>
  );
}
