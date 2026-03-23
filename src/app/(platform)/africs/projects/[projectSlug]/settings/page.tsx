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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, ArrowLeft, Plus, Copy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  getProjectBySlug, updateProject, archiveProject,
  addProjectMember, removeProjectMember,
  getProjectCategories, createProjectCategory,
  getProjectStatuses,
} from "@/lib/actions/projects";
import { createTemplateFromProject } from "@/lib/actions/project-templates";
import { StatusManager } from "@/components/projects/status-manager";
import { ProjectInvoiceButton } from "@/components/invoices/project-invoice-button";
import { getOwnerBusiness } from "@/lib/actions/tenants";

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

type Project = NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>;

export default function ProjectSettingsPage() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [clientType, setClientType] = useState<"internal" | "individual" | "organization">("organization");
  const [ownerTenantId, setOwnerTenantId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [allUsers, setAllUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [projectStatuses, setProjectStatuses] = useState<Awaited<ReturnType<typeof getProjectStatuses>>>([]);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState("");

  const loadData = useCallback(async () => {
    const owner = await getOwnerBusiness();
    if (!owner) return;
    setOwnerTenantId(owner.id);

    const p = await getProjectBySlug(owner.id, params.projectSlug);
    if (!p) { router.push("/africs/projects"); return; }

    setProject(p);
    setIsRolling(p.isRolling);
    setClientType(p.clientType as "internal" | "individual" | "organization");

    const statuses = await getProjectStatuses(p.id);
    setProjectStatuses(statuses);

    setLoading(false);
  }, [params.projectSlug, router]);

  useEffect(() => {
    loadData();
    fetch("/api/tenants/all").then((r) => r.json()).then((data: Tenant[]) => {
      setTenants(data);
      const owner = data.find((t) => t.isOwnerBusiness);
      if (owner) getProjectCategories(owner.id).then(setCategories);
    });
    fetch("/api/users").then((r) => r.json())
      .then((data: { id: string; name: string | null; email: string }[]) => setAllUsers(data))
      .catch(() => {});
  }, [loadData]);

  async function handleAddCategory() {
    if (!newCategoryName.trim() || !ownerTenantId) return;
    const result = await createProjectCategory(ownerTenantId, newCategoryName.trim());
    if (result.success) {
      setNewCategoryName("");
      const cats = await getProjectCategories(ownerTenantId);
      setCategories(cats);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!project) return;
    setSaving(true); setError(""); setSuccess("");

    const formData = new FormData(e.currentTarget);
    formData.set("isRolling", isRolling.toString());
    formData.set("clientType", clientType);

    const result = await updateProject(project.id, formData);
    if (result.error) setError(result.error);
    else { setSuccess("Project updated."); loadData(); }
    setSaving(false);
  }

  async function handleArchive() {
    if (!project || !confirm("Archive this project?")) return;
    const result = await archiveProject(project.id);
    if (result.success) router.push("/africs/projects");
  }

  async function handleAddMember() {
    if (!project || !newMemberId) return;
    await addProjectMember(project.id, newMemberId, newMemberRole);
    setNewMemberId(""); setNewMemberRole("member"); loadData();
  }

  async function handleRemoveMember(userId: string) {
    if (!project) return;
    await removeProjectMember(project.id, userId);
    loadData();
  }

  if (loading || !project) {
    return <div><TopBar title="Project Settings" subtitle="Loading..." /></div>;
  }

  const clientTenants = tenants.filter((t) => !t.isOwnerBusiness);
  const existingMemberIds = project.members.map((m) => m.user.id);
  const availableUsers = allUsers.filter((u) => !existingMemberIds.includes(u.id));

  return (
    <div>
      <TopBar
        title="Project Settings"
        subtitle={project.name}
        actions={
          <Link href={`/africs/projects/${project.slug}`}>
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Project
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-3xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" defaultValue={project.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={project.description ?? ""} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={project.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue={project.priority}>
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
                  <Select name="categoryId" defaultValue={project.category?.id ?? undefined}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category..." className="h-7 text-xs" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }} />
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
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
                <Button type="button" variant={clientType === "internal" ? "default" : "outline"} size="sm" onClick={() => setClientType("internal")}>Internal</Button>
                <Button type="button" variant={clientType === "individual" ? "default" : "outline"} size="sm" onClick={() => setClientType("individual")}>Individual</Button>
                <Button type="button" variant={clientType === "organization" ? "default" : "outline"} size="sm" onClick={() => setClientType("organization")}>Organization</Button>
              </div>

              {clientType === "individual" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name</Label>
                    <Input id="contactName" name="contactName" defaultValue={project.contactName ?? ""} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input id="contactEmail" name="contactEmail" type="email" defaultValue={project.contactEmail ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={project.contactPhone ?? ""} />
                    </div>
                  </div>
                </div>
              )}

              {clientType === "organization" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Existing Client Company</Label>
                    <Select name="clientTenantId" defaultValue={project.clientTenantId ?? undefined}>
                      <SelectTrigger><SelectValue placeholder="Link to existing client (optional)..." /></SelectTrigger>
                      <SelectContent>
                        {clientTenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input id="orgName" name="orgName" defaultValue={project.orgName ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgAddress">Address</Label>
                    <Input id="orgAddress" name="orgAddress" defaultValue={project.orgAddress ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgContactName">Contact Person</Label>
                    <Input id="orgContactName" name="orgContactName" defaultValue={project.orgContactName ?? ""} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orgContactEmail">Contact Email</Label>
                      <Input id="orgContactEmail" name="orgContactEmail" type="email" defaultValue={project.orgContactEmail ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgContactPhone">Contact Phone</Label>
                      <Input id="orgContactPhone" name="orgContactPhone" type="tel" defaultValue={project.orgContactPhone ?? ""} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch id="isRolling" checked={isRolling} onCheckedChange={setIsRolling} />
                <Label htmlFor="isRolling">Rolling / Ongoing project</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : ""} />
                </div>
                {!isRolling && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" defaultValue={project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader><CardTitle className="text-base">Budget & Billing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing Type</Label>
                  <Select name="billingType" defaultValue={project.billingType ?? undefined}>
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
                  <Select name="budgetCurrency" defaultValue={project.budgetCurrency ?? undefined}>
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
                  <Input id="budgetAmount" name="budgetAmount" type="number" step="0.01" defaultValue={project.budgetAmount ? Number(project.budgetAmount) : ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" defaultValue={project.hourlyRate ? Number(project.hourlyRate) : ""} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea name="notes" defaultValue={project.notes ?? ""} rows={4} />
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-500">{success}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Members</CardTitle>
            <CardDescription>People assigned to this project from Africs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {project.members.map((m) => {
                const initials = (m.user.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={m.user.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
                      <div>
                        <p className="text-sm font-medium">{m.user.name ?? m.user.email}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">{m.role}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveMember(m.user.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {availableUsers.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Select value={newMemberId} onValueChange={(v) => v && setNewMemberId(v)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select a user..." /></SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newMemberRole} onValueChange={(v) => v && setNewMemberRole(v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleAddMember} disabled={!newMemberId}>
                  <UserPlus className="h-3.5 w-3.5" />Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Statuses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Statuses</CardTitle>
            <CardDescription>
              Customize the workflow columns for this project. Statuses are grouped into Not Started, Active, Done, and Closed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusManager
              projectId={project.id}
              statuses={projectStatuses}
              onUpdated={loadData}
            />
          </CardContent>
        </Card>

        {/* Generate Invoice */}
        {project && (project.billingType === "hourly" || project.billingType === "fixed" || project.billingType === "retainer") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate Invoice</CardTitle>
              <CardDescription>
                Create an invoice from this project&apos;s billing data{project.billingType === "hourly" ? " and uninvoiced time entries" : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectInvoiceButton projectId={project.id} />
            </CardContent>
          </Card>
        )}

        {/* Save as Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Save as Template
            </CardTitle>
            <CardDescription>
              Save this project&apos;s structure (statuses and tasks) as a reusable template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-9"
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1 shrink-0"
                disabled={!templateName.trim() || savingTemplate}
                onClick={async () => {
                  if (!project) return;
                  setSavingTemplate(true);
                  setTemplateSuccess("");
                  const result = await createTemplateFromProject(project.id, templateName.trim());
                  if (result.success) {
                    setTemplateSuccess("Template saved!");
                    setTemplateName("");
                  }
                  setSavingTemplate(false);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
            {templateSuccess && <p className="text-xs text-emerald-500 mt-2">{templateSuccess}</p>}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-base text-destructive">Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm" onClick={handleArchive}>Archive Project</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
