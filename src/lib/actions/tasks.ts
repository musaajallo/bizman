"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordActivity } from "./project-activity";

export async function getTasksByProject(projectId: string, filters?: {
  statusId?: string;
  assigneeId?: string;
  priority?: string;
}) {
  const where: Record<string, unknown> = { projectId, parentId: null };
  if (filters?.statusId) where.statusId = filters.statusId;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters?.priority) where.priority = filters.priority;

  return prisma.task.findMany({
    where,
    include: {
      status: true,
      assignee: { select: { id: true, name: true, image: true } },
      _count: { select: { subtasks: true } },
    },
    orderBy: [{ milestoneId: "asc" }, { status: { order: "asc" } }, { order: "asc" }],
  });
}

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  if (!title) return { error: "Task title is required" };

  const projectId = formData.get("projectId") as string;
  if (!projectId) return { error: "Project ID is required" };

  // Get the default status for this project
  let statusId = formData.get("statusId") as string;
  if (!statusId) {
    const defaultStatus = await prisma.projectStatus.findFirst({
      where: { projectId, isDefault: true },
    });
    if (!defaultStatus) return { error: "No default status found" };
    statusId = defaultStatus.id;
  }

  // Get next order position
  const lastTask = await prisma.task.findFirst({
    where: { projectId, statusId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      projectId,
      statusId,
      parentId: (formData.get("parentId") as string) || undefined,
      milestoneId: (formData.get("milestoneId") as string) || undefined,
      title,
      description: (formData.get("description") as string) || undefined,
      priority: (formData.get("priority") as string) || "medium",
      order: (lastTask?.order ?? -1) + 1,
      assigneeId: (formData.get("assigneeId") as string) || undefined,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
      estimateMinutes: formData.get("estimateMinutes") ? parseInt(formData.get("estimateMinutes") as string) : undefined,
      createdById: session.user.id,
    },
  });

  await recordActivity(projectId, session.user.id, "created_task", {
    taskTitle: title,
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, taskId: task.id };
}

export async function updateTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const data: Record<string, unknown> = {};

  const title = formData.get("title");
  if (title !== null) data.title = title;

  const description = formData.get("description");
  if (description !== null) data.description = description || undefined;

  const priority = formData.get("priority");
  if (priority !== null) data.priority = priority;

  const statusId = formData.get("statusId");
  if (statusId !== null) data.statusId = statusId;

  const assigneeId = formData.get("assigneeId");
  if (assigneeId !== null) data.assigneeId = assigneeId || null;

  if (formData.get("startDate")) data.startDate = new Date(formData.get("startDate") as string);
  if (formData.get("dueDate")) data.dueDate = new Date(formData.get("dueDate") as string);
  if (formData.get("estimateMinutes")) data.estimateMinutes = parseInt(formData.get("estimateMinutes") as string);

  // If status changed to a "done" group, set completedAt
  if (statusId) {
    const status = await prisma.projectStatus.findUnique({ where: { id: statusId as string } });
    if (status && (status.group === "done" || status.group === "closed")) {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
  }

  await prisma.task.update({ where: { id: taskId }, data });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, statusId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { status: true },
  });
  if (!task) return { error: "Task not found" };

  const status = await prisma.projectStatus.findUnique({ where: { id: statusId } });
  const completedAt = status && (status.group === "done" || status.group === "closed") ? new Date() : null;

  await prisma.task.update({
    where: { id: taskId },
    data: { statusId, completedAt },
  });

  if (status) {
    const action = completedAt ? "completed_task" : "updated_task_status";
    await recordActivity(task.projectId, session.user.id, action, {
      taskTitle: task.title,
      from: task.status.name,
      to: status.name,
    });
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, title: true },
  });

  await prisma.task.delete({ where: { id: taskId } });

  if (task) {
    await recordActivity(task.projectId, session.user.id, "deleted_task", {
      taskTitle: task.title,
    });
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function reorderTasks(statusId: string, orderedTaskIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await Promise.all(
    orderedTaskIds.map((id, index) =>
      prisma.task.update({ where: { id }, data: { order: index, statusId } })
    )
  );

  return { success: true };
}

export async function getTaskDetail(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      status: true,
      assignee: { select: { id: true, name: true, email: true, image: true } },
      createdBy: { select: { id: true, name: true } },
      subtasks: {
        include: {
          status: true,
          assignee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { order: "asc" },
      },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      checklists: {
        include: {
          items: {
            include: {
              assignee: { select: { id: true, name: true, image: true } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getTasksByStatus(projectId: string) {
  const statuses = await prisma.projectStatus.findMany({
    where: { projectId },
    include: {
      tasks: {
        where: { parentId: null },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          _count: { select: { subtasks: true, comments: true, checklists: true } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
  return statuses;
}
