"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function recordActivity(
  projectId: string,
  actorId: string,
  action: string,
  details?: Record<string, unknown>
) {
  await prisma.projectActivity.create({
    data: {
      projectId,
      actorId,
      action,
      details: (details ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getProjectActivities(projectId: string, limit = 50) {
  return prisma.projectActivity.findMany({
    where: { projectId },
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
