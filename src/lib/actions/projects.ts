"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordActivity } from "./project-activity";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DEFAULT_STATUSES = [
  { name: "To Do", color: "#6B7280", group: "not_started", order: 0, isDefault: true },
  { name: "In Progress", color: "#3B82F6", group: "active", order: 1, isDefault: false },
  { name: "Review", color: "#F59E0B", group: "active", order: 2, isDefault: false },
  { name: "Done", color: "#22C55E", group: "done", order: 3, isDefault: false },
];

// --- Categories ---

export async function getProjectCategories(tenantId: string) {
  return prisma.projectCategory.findMany({
    where: { tenantId },
    orderBy: { order: "asc" },
  });
}

export async function createProjectCategory(tenantId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const last = await prisma.projectCategory.findFirst({
    where: { tenantId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const category = await prisma.projectCategory.create({
    data: { tenantId, name, order: (last?.order ?? -1) + 1 },
  });

  return { success: true, id: category.id };
}

// --- Projects ---

export async function getProjects(tenantId: string, filters?: {
  status?: string;
  type?: string;
  clientTenantId?: string;
}) {
  const where: Record<string, unknown> = { tenantId, archivedAt: null };
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;
  if (filters?.clientTenantId) where.clientTenantId = filters.clientTenantId;

  const projects = await prisma.project.findMany({
    where,
    include: {
      clientTenant: { select: { name: true, slug: true } },
      category: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => ({
    ...p,
    budgetAmount: p.budgetAmount ? Number(p.budgetAmount) : null,
    hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
  }));
}

export async function getProjectBySlug(tenantId: string, slug: string) {
  const project = await prisma.project.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: {
      clientTenant: { select: { name: true, slug: true } },
      category: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      statuses: { orderBy: { order: "asc" } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) return null;

  return {
    ...project,
    budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : null,
    hourlyRate: project.hourlyRate ? Number(project.hourlyRate) : null,
  };
}

export async function getProjectsForClient(clientTenantId: string) {
  const projects = await prisma.project.findMany({
    where: { clientTenantId, archivedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => ({
    ...p,
    budgetAmount: p.budgetAmount ? Number(p.budgetAmount) : null,
    hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
  }));
}

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  if (!name) return { error: "Project name is required" };

  const tenantId = formData.get("tenantId") as string;
  if (!tenantId) return { error: "Tenant ID is required" };

  let slug = slugify(name);
  const existing = await prisma.project.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const clientType = (formData.get("clientType") as string) || "organization";

  const project = await prisma.project.create({
    data: {
      tenantId,
      name,
      slug,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as string) || "not_started",
      priority: (formData.get("priority") as string) || "medium",
      type: (formData.get("type") as string) || "client",
      clientType,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : undefined,
      isRolling: formData.get("isRolling") === "true",
      // Individual fields
      contactName: clientType === "individual" ? ((formData.get("contactName") as string) || undefined) : undefined,
      contactEmail: clientType === "individual" ? ((formData.get("contactEmail") as string) || undefined) : undefined,
      contactPhone: clientType === "individual" ? ((formData.get("contactPhone") as string) || undefined) : undefined,
      // Organization fields
      clientTenantId: clientType === "organization" ? ((formData.get("clientTenantId") as string) || undefined) : undefined,
      orgName: clientType === "organization" ? ((formData.get("orgName") as string) || undefined) : undefined,
      orgAddress: clientType === "organization" ? ((formData.get("orgAddress") as string) || undefined) : undefined,
      orgContactName: clientType === "organization" ? ((formData.get("orgContactName") as string) || undefined) : undefined,
      orgContactEmail: clientType === "organization" ? ((formData.get("orgContactEmail") as string) || undefined) : undefined,
      orgContactPhone: clientType === "organization" ? ((formData.get("orgContactPhone") as string) || undefined) : undefined,
      // Budget
      billingType: (formData.get("billingType") as string) || undefined,
      budgetAmount: formData.get("budgetAmount") ? parseFloat(formData.get("budgetAmount") as string) : undefined,
      budgetCurrency: (formData.get("budgetCurrency") as string) || undefined,
      hourlyRate: formData.get("hourlyRate") ? parseFloat(formData.get("hourlyRate") as string) : undefined,
      // Category
      categoryId: (formData.get("categoryId") as string) || undefined,
      tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [],
      notes: (formData.get("notes") as string) || undefined,
      createdById: session.user.id,
    },
  });

  // Seed default statuses
  await prisma.projectStatus.createMany({
    data: DEFAULT_STATUSES.map((s) => ({ ...s, projectId: project.id })),
  });

  // Add creator as project lead
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: session.user.id, role: "lead" },
  });

  await recordActivity(project.id, session.user.id, "created_project", {
    projectName: name,
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, slug: project.slug };
}

export async function updateProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const data: Record<string, unknown> = {};
  const fields = [
    "name", "description", "status", "priority", "type", "clientType",
    "contactName", "contactEmail", "contactPhone",
    "orgName", "orgAddress", "orgContactName", "orgContactEmail", "orgContactPhone",
    "billingType", "budgetCurrency", "notes",
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) data[field] = value || undefined;
  }

  if (formData.get("startDate")) data.startDate = new Date(formData.get("startDate") as string);
  if (formData.get("endDate")) data.endDate = new Date(formData.get("endDate") as string);
  if (formData.has("isRolling")) data.isRolling = formData.get("isRolling") === "true";
  if (formData.get("clientTenantId")) data.clientTenantId = formData.get("clientTenantId") as string;
  if (formData.get("budgetAmount")) data.budgetAmount = parseFloat(formData.get("budgetAmount") as string);
  if (formData.get("hourlyRate")) data.hourlyRate = parseFloat(formData.get("hourlyRate") as string);
  if (formData.get("tags")) data.tags = JSON.parse(formData.get("tags") as string);

  const categoryId = formData.get("categoryId");
  if (categoryId !== null) data.categoryId = categoryId || null;

  await prisma.project.update({ where: { id: projectId }, data });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function updateProjectStatus(projectId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function archiveProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function getProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addProjectMember(projectId: string, userId: string, role: string = "member") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) return { error: "User is already a member" };

  await prisma.projectMember.create({ data: { projectId, userId, role } });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  await recordActivity(projectId, session.user.id, "added_member", {
    memberName: user?.name ?? "Unknown",
    role,
  });

  revalidatePath("/africs/projects");
  return { success: true };
}

export async function removeProjectMember(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { user: { select: { name: true } } },
  });

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  if (member) {
    await recordActivity(projectId, session.user.id, "removed_member", {
      memberName: member.user.name ?? "Unknown",
    });
  }

  revalidatePath("/africs/projects");
  return { success: true };
}

// --- Project Statuses (per-project task statuses) ---

export async function getProjectStatuses(projectId: string) {
  return prisma.projectStatus.findMany({
    where: { projectId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { order: "asc" },
  });
}

export async function createProjectStatus(
  projectId: string,
  data: { name: string; color: string; group: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await prisma.projectStatus.findUnique({
    where: { projectId_name: { projectId, name: data.name } },
  });
  if (existing) return { error: "A status with that name already exists" };

  const last = await prisma.projectStatus.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.projectStatus.create({
    data: {
      projectId,
      name: data.name,
      color: data.color,
      group: data.group,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function updateProjectStatusItem(
  statusId: string,
  data: { name?: string; color?: string; group?: string; isDefault?: boolean }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const status = await prisma.projectStatus.findUnique({ where: { id: statusId } });
  if (!status) return { error: "Status not found" };

  // If setting as default, unset others first
  if (data.isDefault) {
    await prisma.projectStatus.updateMany({
      where: { projectId: status.projectId, isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.projectStatus.update({
    where: { id: statusId },
    data,
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteProjectStatus(statusId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const status = await prisma.projectStatus.findUnique({
    where: { id: statusId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!status) return { error: "Status not found" };
  if (status._count.tasks > 0) return { error: "Cannot delete a status that has tasks. Move the tasks first." };
  if (status.isDefault) return { error: "Cannot delete the default status" };

  await prisma.projectStatus.delete({ where: { id: statusId } });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function reorderProjectStatuses(projectId: string, orderedIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.projectStatus.update({ where: { id }, data: { order: index } })
    )
  );

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function getProjectStats(projectId: string) {
  const statuses = await prisma.projectStatus.findMany({
    where: { projectId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { order: "asc" },
  });

  const overdueTasks = await prisma.task.findMany({
    where: {
      projectId,
      dueDate: { lt: new Date() },
      completedAt: null,
    },
    select: { id: true, title: true, dueDate: true, priority: true },
    orderBy: { dueDate: "asc" },
    take: 20,
  });

  const totalTasks = statuses.reduce((sum, s) => sum + s._count.tasks, 0);
  const doneTasks = statuses
    .filter((s) => s.group === "done" || s.group === "closed")
    .reduce((sum, s) => sum + s._count.tasks, 0);

  return { statuses, overdue: overdueTasks.length, overdueTasks, totalTasks, doneTasks };
}
