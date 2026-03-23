"use client";

import { TopBar } from "@/components/layout/top-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateTenant } from "@/lib/actions/tenants";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Users, FileText, FileOutput } from "lucide-react";

const allModules = [
  {
    id: "hr",
    name: "HR & Profiles",
    description: "Employee profiles, document management, and staff records.",
    icon: Users,
  },
  {
    id: "forms",
    name: "Form Builder",
    description: "Create dynamic forms for data collection and submissions.",
    icon: FileText,
  },
  {
    id: "pdf",
    name: "PDF Generation",
    description: "Generate branded PDFs from profiles and form submissions.",
    icon: FileOutput,
  },
];

interface TenantModules {
  id: string;
  name: string;
  enabledModules: string[];
}

export default function ModulesPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantModules | null>(null);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/tenants/${params.slug}`)
      .then((r) => r.json())
      .then((data: TenantModules) => {
        setTenant(data);
        setEnabled(data.enabledModules || []);
      });
  }, [params.slug]);

  function toggleModule(moduleId: string) {
    setEnabled((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  }

  async function handleSave() {
    if (!tenant) return;
    setLoading(true);
    setSaved(false);

    const formData = new FormData();
    formData.set("enabledModules", JSON.stringify(enabled));
    await updateTenant(tenant.id, formData);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!tenant) {
    return (
      <div>
        <TopBar title="Modules" subtitle="Loading..." />
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Loading module settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Modules" subtitle={tenant.name} />

      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Modules</CardTitle>
            <CardDescription>
              Enable or disable modules for this company. Disabled modules won&apos;t appear in their workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {allModules.map((mod) => (
              <div
                key={mod.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <mod.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor={mod.id} className="text-sm font-medium cursor-pointer">
                    {mod.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                </div>
                <Switch
                  id={mod.id}
                  checked={enabled.includes(mod.id)}
                  onCheckedChange={() => toggleModule(mod.id)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {saved && (
            <span className="text-sm text-emerald-500">Saved successfully</span>
          )}
        </div>
      </div>
    </div>
  );
}
