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
import { createTenant } from "@/lib/actions/tenants";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createTenant(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.slug) {
      router.push(`/clients/${result.slug}/dashboard`);
    }
  }

  return (
    <div>
      <TopBar title="Add Company" subtitle="Create a new client workspace" />

      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
              Enter the basic information for the new client company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  placeholder="e.g. Technology, Finance, Healthcare"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryContactName">Primary Contact Name</Label>
                <Input
                  id="primaryContactName"
                  name="primaryContactName"
                  placeholder="e.g. John Smith"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryContactEmail">Contact Email</Label>
                  <Input
                    id="primaryContactEmail"
                    name="primaryContactEmail"
                    type="email"
                    placeholder="john@acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryContactPhone">Contact Phone</Label>
                  <Input
                    id="primaryContactPhone"
                    name="primaryContactPhone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Company"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
