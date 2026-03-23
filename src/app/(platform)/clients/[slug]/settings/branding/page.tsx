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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTenant } from "@/lib/actions/tenants";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface TenantBranding {
  id: string;
  name: string;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  headerLayout: string | null;
  footerText: string | null;
  pdfWatermark: string | null;
}

export default function BrandingPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/tenants/${params.slug}`)
      .then((r) => r.json())
      .then(setTenant);
  }, [params.slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);
    setSaved(false);

    const formData = new FormData(e.currentTarget);
    await updateTenant(tenant.id, formData);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!tenant) {
    return (
      <div>
        <TopBar title="Branding" subtitle="Loading..." />
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Branding" subtitle={tenant.name} />

      <div className="p-6 max-w-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colors</CardTitle>
              <CardDescription>
                Customize the colors used in this company&apos;s portal and PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      defaultValue={tenant.primaryColor || "#098B4F"}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      defaultValue={tenant.primaryColor || "#098B4F"}
                      className="flex-1 font-mono text-sm"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      name="accentColor"
                      type="color"
                      defaultValue={tenant.accentColor || "#E7BB41"}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      defaultValue={tenant.accentColor || "#E7BB41"}
                      className="flex-1 font-mono text-sm"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Typography & Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select name="fontFamily" defaultValue={tenant.fontFamily || "dm-sans"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dm-sans">DM Sans</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="open-sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerLayout">Header Layout</Label>
                <Select name="headerLayout" defaultValue={tenant.headerLayout || "standard"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="centered">Centered</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">PDF Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  name="footerText"
                  defaultValue={tenant.footerText || ""}
                  placeholder="e.g. Confidential - Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfWatermark">PDF Watermark</Label>
                <Input
                  id="pdfWatermark"
                  name="pdfWatermark"
                  defaultValue={tenant.pdfWatermark || ""}
                  placeholder="e.g. DRAFT, CONFIDENTIAL"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            {saved && (
              <span className="text-sm text-emerald-500">Saved successfully</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
