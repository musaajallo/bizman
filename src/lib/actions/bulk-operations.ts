"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordActivity } from "./project-activity";

export async function bulkUpdateTaskStatus(taskIds: string[], statusId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const status = await prisma.projectStatus.findUnique({ where: { id: statusId } });
  if (!status) return { error: "Status not found" };

  const completedAt = status.group === "done" || status.group === "closed" ? new Date() : null;

  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { statusId, completedAt },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, count: taskIds.length };
}

export async function bulkUpdateTaskPriority(taskIds: string[], priority: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { priority },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, count: taskIds.length };
}

export async function bulkAssignTasks(taskIds: string[], assigneeId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { assigneeId },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, count: taskIds.length };
}

export async function bulkDeleteTasks(taskIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Get project IDs for activity recording
  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds } },
    select: { projectId: true, title: true },
  });

  await prisma.task.deleteMany({
    where: { id: { in: taskIds } },
  });

  // Record activity for each unique project
  const projectIds = [...new Set(tasks.map((t) => t.projectId))];
  for (const projectId of projectIds) {
    const deletedCount = tasks.filter((t) => t.projectId === projectId).length;
    await recordActivity(projectId, session.user.id, "bulk_deleted_tasks", {
      count: deletedCount,
    });
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, count: taskIds.length };
}

export async function bulkSetDueDate(taskIds: string[], dueDate: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, count: taskIds.length };
}
