"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

interface TemplateStatus {
  name: string;
  color: string;
  group: string;
  order: number;
  isDefault: boolean;
}

export async function getTemplates(tenantId: string) {
  return prisma.projectTemplate.findMany({
    where: { tenantId },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTemplate(templateId: string) {
  return prisma.projectTemplate.findUnique({
    where: { id: templateId },
    include: {
      tasks: { orderBy: { order: "asc" } },
    },
  });
}

export async function createTemplateFromProject(projectId: string, name: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      statuses: { orderBy: { order: "asc" } },
      tasks: {
        where: { parentId: null },
        include: { subtasks: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!project) return { error: "Project not found" };

  const statuses: TemplateStatus[] = project.statuses.map((s) => ({
    name: s.name,
    color: s.color,
    group: s.group,
    order: s.order,
    isDefault: s.isDefault,
  }));

  // Map status IDs to indices
  const statusIdToIndex: Record<string, number> = {};
  project.statuses.forEach((s, i) => { statusIdToIndex[s.id] = i; });

  const template = await prisma.projectTemplate.create({
    data: {
      tenantId: project.tenantId,
      name,
      description: description || undefined,
      category: project.categoryId ? undefined : undefined,
      statuses: statuses as unknown as Prisma.InputJsonValue,
      createdById: session.user.id,
      tasks: {
        create: project.tasks.flatMap((task, idx) => {
          const parent = {
            title: task.title,
            description: task.description,
            priority: task.priority,
            statusIndex: statusIdToIndex[task.statusId] ?? 0,
            order: idx,
          };
          // Subtasks will be created separately to get parentId
          return [parent];
        }),
      },
    },
  });

  // Create subtasks in a second pass
  const templateTasks = await prisma.projectTemplateTask.findMany({
    where: { templateId: template.id },
    orderBy: { order: "asc" },
  });

  for (let i = 0; i < project.tasks.length; i++) {
    const originalTask = project.tasks[i];
    const templateTask = templateTasks[i];
    if (originalTask.subtasks.length > 0 && templateTask) {
      await prisma.projectTemplateTask.createMany({
        data: originalTask.subtasks.map((sub, subIdx) => ({
          templateId: template.id,
          parentId: templateTask.id,
          title: sub.title,
          description: sub.description,
          priority: sub.priority,
          statusIndex: statusIdToIndex[sub.statusId] ?? 0,
          order: subIdx,
        })),
      });
    }
  }

  revalidatePath("/africs/projects");
  return { success: true, templateId: template.id };
}

export async function createProjectFromTemplate(
  templateId: string,
  projectData: {
    tenantId: string;
    name: string;
    slug: string;
    description?: string;
    clientTenantId?: string;
    clientType?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const template = await prisma.projectTemplate.findUnique({
    where: { id: templateId },
    include: {
      tasks: { orderBy: { order: "asc" } },
    },
  });
  if (!template) return { error: "Template not found" };

  const statuses = template.statuses as unknown as TemplateStatus[];

  // Create project
  const project = await prisma.project.create({
    data: {
      tenantId: projectData.tenantId,
      name: projectData.name,
      slug: projectData.slug,
      description: projectData.description,
      clientTenantId: projectData.clientTenantId || undefined,
      clientType: projectData.clientType || "organization",
      type: projectData.type || "client",
      startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
      endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
      createdById: session.user.id,
    },
  });

  // Create statuses
  const createdStatuses = await Promise.all(
    statuses.map((s) =>
      prisma.projectStatus.create({
        data: {
          projectId: project.id,
          name: s.name,
          color: s.color,
          group: s.group,
          order: s.order,
          isDefault: s.isDefault,
        },
      })
    )
  );

  // Add creator as lead
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: session.user.id, role: "lead" },
  });

  // Create tasks from template (top-level first)
  const topLevelTasks = template.tasks.filter((t) => !t.parentId);
  const templateTaskToProjectTask: Record<string, string> = {};

  for (const tt of topLevelTasks) {
    const statusId = createdStatuses[tt.statusIndex]?.id ?? createdStatuses[0]?.id;
    if (!statusId) continue;
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        statusId,
        title: tt.title,
        description: tt.description,
        priority: tt.priority,
        order: tt.order,
        createdById: session.user.id,
      },
    });
    templateTaskToProjectTask[tt.id] = task.id;
  }

  // Create subtasks
  const subtaskTemplates = template.tasks.filter((t) => t.parentId);
  for (const st of subtaskTemplates) {
    const parentId = st.parentId ? templateTaskToProjectTask[st.parentId] : undefined;
    const statusId = createdStatuses[st.statusIndex]?.id ?? createdStatuses[0]?.id;
    if (!statusId || !parentId) continue;
    await prisma.task.create({
      data: {
        projectId: project.id,
        statusId,
        parentId,
        title: st.title,
        description: st.description,
        priority: st.priority,
        order: st.order,
        createdById: session.user.id,
      },
    });
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, projectId: project.id, projectSlug: project.slug };
}

export async function deleteTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.projectTemplate.delete({ where: { id: templateId } });

  revalidatePath("/africs/projects");
  return { success: true };
}
