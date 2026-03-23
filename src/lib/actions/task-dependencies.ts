"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTaskDependencies(taskId: string) {
  const [blockedBy, blocking] = await Promise.all([
    prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOn: {
          select: { id: true, title: true, completedAt: true, status: { select: { name: true, color: true, group: true } } },
        },
      },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      include: {
        task: {
          select: { id: true, title: true, completedAt: true, status: { select: { name: true, color: true, group: true } } },
        },
      },
    }),
  ]);
  return { blockedBy, blocking };
}

export async function addDependency(taskId: string, dependsOnId: string, type = "finish_to_start") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (taskId === dependsOnId) return { error: "A task cannot depend on itself" };

  // Check for circular dependencies
  const isCircular = await checkCircular(dependsOnId, taskId);
  if (isCircular) return { error: "This would create a circular dependency" };

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });
  if (existing) return { error: "Dependency already exists" };

  await prisma.taskDependency.create({
    data: { taskId, dependsOnId, type },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function removeDependency(taskId: string, dependsOnId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.taskDependency.deleteMany({
    where: { taskId, dependsOnId },
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

async function checkCircular(fromTaskId: string, toTaskId: string): Promise<boolean> {
  // BFS: starting from fromTaskId, follow blockedBy links to see if we reach toTaskId
  const visited = new Set<string>();
  const queue = [fromTaskId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === toTaskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnId: true },
    });
    for (const dep of deps) {
      queue.push(dep.dependsOnId);
    }
  }
  return false;
}

export async function getAvailableDependencies(projectId: string, excludeTaskId: string) {
  return prisma.task.findMany({
    where: {
      projectId,
      id: { not: excludeTaskId },
      parentId: null,
    },
    select: { id: true, title: true, status: { select: { name: true, color: true } } },
    orderBy: { title: "asc" },
  });
}
