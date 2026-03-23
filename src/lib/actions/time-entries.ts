"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTimeEntries(taskId: string) {
  return prisma.timeEntry.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function logTime(taskId: string, minutes: number, description?: string, date?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (minutes <= 0) return { error: "Minutes must be positive" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, loggedMinutes: true },
  });
  if (!task) return { error: "Task not found" };

  await prisma.$transaction([
    prisma.timeEntry.create({
      data: {
        taskId,
        userId: session.user.id,
        minutes,
        description: description || undefined,
        date: date ? new Date(date) : new Date(),
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { loggedMinutes: task.loggedMinutes + minutes },
    }),
  ]);

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteTimeEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: { task: { select: { id: true, loggedMinutes: true } } },
  });
  if (!entry) return { error: "Entry not found" };

  await prisma.$transaction([
    prisma.timeEntry.delete({ where: { id: entryId } }),
    prisma.task.update({
      where: { id: entry.taskId },
      data: { loggedMinutes: Math.max(0, entry.task.loggedMinutes - entry.minutes) },
    }),
  ]);

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function getProjectTimeReport(projectId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { task: { projectId } },
    include: {
      user: { select: { id: true, name: true, image: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { date: "desc" },
  });

  // Aggregate by user
  const byUser: Record<string, { name: string; image: string | null; totalMinutes: number }> = {};
  for (const entry of entries) {
    const uid = entry.userId;
    if (!byUser[uid]) {
      byUser[uid] = { name: entry.user.name ?? "Unknown", image: entry.user.image, totalMinutes: 0 };
    }
    byUser[uid].totalMinutes += entry.minutes;
  }

  // Aggregate by task
  const byTask: Record<string, { title: string; totalMinutes: number }> = {};
  for (const entry of entries) {
    const tid = entry.taskId;
    if (!byTask[tid]) {
      byTask[tid] = { title: entry.task.title, totalMinutes: 0 };
    }
    byTask[tid].totalMinutes += entry.minutes;
  }

  const totalMinutes = entries.reduce((sum: number, e) => sum + e.minutes, 0);

  return {
    entries,
    byUser: Object.entries(byUser).map(([id, data]) => ({ id, ...data })),
    byTask: Object.entries(byTask).map(([id, data]) => ({ id, ...data })),
    totalMinutes,
  };
}
