"use client";

import { TopBar } from "@/components/layout/top-bar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createProject, getProjectCategories, createProjectCategory } from "@/lib/actions/projects";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isOwnerBusiness: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientType, setClientType] = useState<"internal" | "individual" | "organization">("organization");
  const [isRolling, setIsRolling] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [ownerTenantId, setOwnerTenantId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    fetch("/api/tenants/all")
      .then((r) => r.json())
      .then((data: Tenant[]) => {
        setTenants(data);
        const owner = data.find((t) => t.isOwnerBusiness);
        if (owner) {
          setOwnerTenantId(owner.id);
          getProjectCategories(owner.id).then(setCategories);
        }
      });
  }, []);

  async function handleAddCategory() {
    if (!newCategoryName.trim() || !ownerTenantId) return;
    setAddingCategory(true);
    const result = await createProjectCategory(ownerTenantId, newCategoryName.trim());
    if (result.success) {
      setNewCategoryName("");
      const cats = await getProjectCategories(ownerTenantId);
      setCategories(cats);
    }
    setAddingCategory(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("tenantId", ownerTenantId);
    formData.set("isRolling", isRolling.toString());
    formData.set("clientType", clientType);

    const result = await createProject(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.slug) {
      router.push(`/africs/projects/${result.slug}`);
    }
  }

  const clientTenants = tenants.filter((t) => !t.isOwnerBusiness);

  return (
    <div>
      <TopBar title="New Project" subtitle="Create a new project" />

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Website Redesign" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Brief description of the project..." rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="type" defaultValue="client">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="retainer">Retainer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="categoryId">
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category..."
                      className="h-7 text-xs"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                    />
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client / Entity</CardTitle>
              <CardDescription>Who is this project for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button type="button" variant={clientType === "internal" ? "default" : "outline"} size="sm" onClick={() => setClientType("internal")}>
                  Internal
                </Button>
                <Button type="button" variant={clientType === "individual" ? "default" : "outline"} size="sm" onClick={() => setClientType("individual")}>
                  Individual
                </Button>
                <Button type="button" variant={clientType === "organization" ? "default" : "outline"} size="sm" onClick={() => setClientType("organization")}>
                  Organization
                </Button>
              </div>

              {clientType === "individual" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name *</Label>
                    <Input id="contactName" name="contactName" placeholder="John Smith" required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input id="contactEmail" name="contactEmail" type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input id="contactPhone" name="contactPhone" type="tel" placeholder="+220 000 0000" />
                    </div>
                  </div>
                </div>
              )}

              {clientType === "organization" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Existing Client Company</Label>
                    <Select name="clientTenantId">
                      <SelectTrigger><SelectValue placeholder="Link to existing client (optional)..." /></SelectTrigger>
                      <SelectContent>
                        {clientTenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Or enter details manually:</p>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input id="orgName" name="orgName" placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgAddress">Address</Label>
                    <Input id="orgAddress" name="orgAddress" placeholder="123 Main St, City" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgContactName">Contact Person</Label>
                    <Input id="orgContactName" name="orgContactName" placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orgContactEmail">Contact Email</Label>
                      <Input id="orgContactEmail" name="orgContactEmail" type="email" placeholder="jane@acme.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgContactPhone">Contact Phone</Label>
                      <Input id="orgContactPhone" name="orgContactPhone" type="tel" placeholder="+220 000 0000" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch id="isRolling" checked={isRolling} onCheckedChange={setIsRolling} />
                <Label htmlFor="isRolling">Ongoing / Rolling project (no fixed end date)</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                {!isRolling && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget & Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing Type</Label>
                  <Select name="billingType">
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="retainer">Retainer</SelectItem>
                      <SelectItem value="pro_bono">Pro Bono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select name="budgetCurrency">
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="GMD">GMD</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="GHS">GHS</SelectItem>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budgetAmount">Budget Amount</Label>
                  <Input id="budgetAmount" name="budgetAmount" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea name="notes" placeholder="Any additional notes about this project..." rows={4} />
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
