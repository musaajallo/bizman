"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordActivity } from "./project-activity";

export async function getMilestones(projectId: string) {
  return prisma.milestone.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
}

export async function createMilestone(
  projectId: string,
  data: { name: string; description?: string; dueDate?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!data.name.trim()) return { error: "Milestone name is required" };

  const last = await prisma.milestone.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      order: (last?.order ?? -1) + 1,
    },
  });

  await recordActivity(projectId, session.user.id, "created_milestone", {
    milestoneName: milestone.name,
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, id: milestone.id };
}

export async function updateMilestone(
  milestoneId: string,
  data: { name?: string; description?: string; dueDate?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim() || null;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  await prisma.milestone.update({ where: { id: milestoneId }, data: updateData });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function toggleMilestone(milestoneId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) return { error: "Milestone not found" };

  const completed = !milestone.completed;
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  if (completed) {
    await recordActivity(milestone.projectId, session.user.id, "completed_milestone", {
      milestoneName: milestone.name,
    });
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteMilestone(milestoneId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.milestone.delete({ where: { id: milestoneId } });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}
