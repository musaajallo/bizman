"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTaskChecklists(taskId: string) {
  return prisma.taskChecklist.findMany({
    where: { taskId },
    include: {
      items: {
        include: {
          assignee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

export async function createChecklist(taskId: string, title: string = "Checklist") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const last = await prisma.taskChecklist.findFirst({
    where: { taskId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const checklist = await prisma.taskChecklist.create({
    data: { taskId, title, order: (last?.order ?? -1) + 1 },
  });

  revalidatePath("/africs/projects");
  return { success: true, id: checklist.id };
}

export async function deleteChecklist(checklistId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.taskChecklist.delete({ where: { id: checklistId } });

  revalidatePath("/africs/projects");
  return { success: true };
}

export async function addChecklistItem(checklistId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!title.trim()) return { error: "Item title is required" };

  const last = await prisma.taskChecklistItem.findFirst({
    where: { checklistId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.taskChecklistItem.create({
    data: { checklistId, title: title.trim(), order: (last?.order ?? -1) + 1 },
  });

  revalidatePath("/africs/projects");
  return { success: true };
}

export async function toggleChecklistItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found" };

  await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: { isComplete: !item.isComplete },
  });

  revalidatePath("/africs/projects");
  return { success: true };
}

export async function deleteChecklistItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.taskChecklistItem.delete({ where: { id: itemId } });

  revalidatePath("/africs/projects");
  return { success: true };
}
