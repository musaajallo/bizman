"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";
import { LEAVE_SETTINGS_DEFAULTS, type LeaveSettingsValues, type AnnualLeaveTier } from "@/lib/leave-settings-defaults";

export type { LeaveSettingsValues } from "@/lib/leave-settings-defaults";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

function parseTiers(raw: unknown): AnnualLeaveTier[] {
  if (!Array.isArray(raw)) return [];
  return (raw as AnnualLeaveTier[])
    .filter((t) => typeof t.minYears === "number" && typeof t.days === "number")
    .sort((a, b) => a.minYears - b.minYears);
}

export async function getLeaveSettings(tenantId?: string): Promise<LeaveSettingsValues> {
  const id = tenantId ?? (await getOwnerBusiness())?.id;
  if (!id) return LEAVE_SETTINGS_DEFAULTS;

  const s = await prisma.leaveSettings.findUnique({ where: { tenantId: id } });
  if (!s) return LEAVE_SETTINGS_DEFAULTS;

  return {
    maternityLeaveDays: s.maternityLeaveDays,
    maternityCanCombineWithAnnual: s.maternityCanCombineWithAnnual,
    paternityLeaveDays: s.paternityLeaveDays,
    paternityCanCombineWithAnnual: s.paternityCanCombineWithAnnual,
    sickLeaveAccrualPerMonth: toNum(s.sickLeaveAccrualPerMonth),
    annualLeaveDefaultDays: s.annualLeaveDefaultDays,
    annualLeaveTiers: parseTiers(s.annualLeaveTiers),
  };
}

export async function getLeaveSettingsHistory() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const logs = await prisma.leaveSettingsLog.findMany({
    where: { tenantId: owner.id },
    include: { changedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs.map((l) => ({
    id: l.id,
    maternityLeaveDays: l.maternityLeaveDays,
    maternityCanCombineWithAnnual: l.maternityCanCombineWithAnnual,
    paternityLeaveDays: l.paternityLeaveDays,
    paternityCanCombineWithAnnual: l.paternityCanCombineWithAnnual,
    sickLeaveAccrualPerMonth: toNum(l.sickLeaveAccrualPerMonth),
    annualLeaveDefaultDays: l.annualLeaveDefaultDays,
    annualLeaveTiers: parseTiers(l.annualLeaveTiers),
    createdAt: l.createdAt.toISOString(),
    changedBy: l.changedBy,
  }));
}

export async function updateLeaveSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const maternityDays = parseInt(formData.get("maternityLeaveDays") as string);
  const paternityDays = parseInt(formData.get("paternityLeaveDays") as string);
  const sickAccrual = parseFloat(formData.get("sickLeaveAccrualPerMonth") as string);
  const annualDays = parseInt(formData.get("annualLeaveDefaultDays") as string);
  const maternityWithAnnual = formData.get("maternityCanCombineWithAnnual") === "true";
  const paternityWithAnnual = formData.get("paternityCanCombineWithAnnual") === "true";

  // Parse tiers
  let tiers: AnnualLeaveTier[] = [];
  const tiersRaw = formData.get("annualLeaveTiers") as string | null;
  if (tiersRaw) {
    try {
      const parsed = JSON.parse(tiersRaw);
      tiers = parseTiers(parsed);
      // Validate no duplicate minYears
      const mins = tiers.map((t) => t.minYears);
      if (new Set(mins).size !== mins.length) return { error: "Each tier must have a unique minimum years value" };
      if (tiers.some((t) => t.minYears < 0)) return { error: "Minimum years must be 0 or more" };
      if (tiers.some((t) => t.days < 1)) return { error: "Days per tier must be at least 1" };
    } catch {
      return { error: "Invalid tiers format" };
    }
  }

  if (isNaN(maternityDays) || maternityDays < 1) return { error: "Maternity leave days must be at least 1" };
  if (isNaN(paternityDays) || paternityDays < 1) return { error: "Paternity leave days must be at least 1" };
  if (isNaN(sickAccrual) || sickAccrual < 0) return { error: "Sick leave accrual must be 0 or more" };
  if (isNaN(annualDays) || annualDays < 1) return { error: "Annual leave days must be at least 1" };

  await prisma.$transaction([
    prisma.leaveSettings.upsert({
      where: { tenantId: owner.id },
      create: {
        tenantId: owner.id,
        maternityLeaveDays: maternityDays,
        maternityCanCombineWithAnnual: maternityWithAnnual,
        paternityLeaveDays: paternityDays,
        paternityCanCombineWithAnnual: paternityWithAnnual,
        sickLeaveAccrualPerMonth: sickAccrual,
        annualLeaveDefaultDays: annualDays,
        annualLeaveTiers: tiers as unknown as Prisma.InputJsonValue,
      },
      update: {
        maternityLeaveDays: maternityDays,
        maternityCanCombineWithAnnual: maternityWithAnnual,
        paternityLeaveDays: paternityDays,
        paternityCanCombineWithAnnual: paternityWithAnnual,
        sickLeaveAccrualPerMonth: sickAccrual,
        annualLeaveDefaultDays: annualDays,
        annualLeaveTiers: tiers as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.leaveSettingsLog.create({
      data: {
        tenantId: owner.id,
        changedById: session.user.id,
        maternityLeaveDays: maternityDays,
        maternityCanCombineWithAnnual: maternityWithAnnual,
        paternityLeaveDays: paternityDays,
        paternityCanCombineWithAnnual: paternityWithAnnual,
        sickLeaveAccrualPerMonth: sickAccrual,
        annualLeaveDefaultDays: annualDays,
        annualLeaveTiers: tiers as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/africs/settings/hr/leave");
  return { success: true };
}
