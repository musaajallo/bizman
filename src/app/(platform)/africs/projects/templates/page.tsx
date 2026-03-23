"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { TemplateManager } from "@/components/projects/template-manager";

export default function TemplatesPage() {
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
        <div className="p-6"><div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded" />)}
        </div></div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Project Templates"
        subtitle="Reusable project structures"
        actions={
          <Link href="/africs/projects">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Projects
            </Button>
          </Link>
        }
      />
      <div className="p-6 max-w-2xl">
        <TemplateManager
          tenantId={tenantId}
          onProjectCreated={(slug) => router.push(`/africs/projects/${slug}`)}
        />
      </div>
    </div>
  );
}
