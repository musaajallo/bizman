"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

export async function getLoanSettings() {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const settings = await prisma.loanSettings.upsert({
    where: { tenantId: owner.id },
    create: { tenantId: owner.id, requireApproval: true, approverIds: [] },
    update: {},
  });

  return settings;
}

export async function saveLoanSettings(approverIds: string[], requireApproval: boolean) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.loanSettings.upsert({
    where: { tenantId: owner.id },
    create: { tenantId: owner.id, requireApproval, approverIds },
    update: { requireApproval, approverIds },
  });

  revalidatePath("/africs/settings/hr/loans");
  return { success: true };
}

export async function getTeamMembersForApprovers() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const members = await prisma.tenantUser.findMany({
    where: { tenantId: owner.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return members.map((m) => ({
    userId: m.userId,
    name: m.user.name ?? m.user.email ?? m.userId,
    email: m.user.email,
    role: m.role,
  }));
}
