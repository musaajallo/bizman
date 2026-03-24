"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

const DEFAULTS = {
  standardRateMultiplier: 1.5,
  weekendRateMultiplier: 2.0,
  holidayRateMultiplier: 2.5,
};

export async function getOvertimeSettings(tenantId?: string) {
  const id = tenantId ?? (await getOwnerBusiness())?.id;
  if (!id) return DEFAULTS;

  const settings = await prisma.overtimeSettings.findUnique({ where: { tenantId: id } });
  if (!settings) return DEFAULTS;

  return {
    standardRateMultiplier: toNum(settings.standardRateMultiplier),
    weekendRateMultiplier: toNum(settings.weekendRateMultiplier),
    holidayRateMultiplier: toNum(settings.holidayRateMultiplier),
  };
}

export async function getOvertimeSettingsHistory() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const logs = await prisma.overtimeSettingsLog.findMany({
    where: { tenantId: owner.id },
    include: { changedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs.map((l) => ({
    id: l.id,
    standardRateMultiplier: toNum(l.standardRateMultiplier),
    weekendRateMultiplier: toNum(l.weekendRateMultiplier),
    holidayRateMultiplier: toNum(l.holidayRateMultiplier),
    createdAt: l.createdAt.toISOString(),
    changedBy: l.changedBy,
  }));
}

export async function updateOvertimeSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const standard = parseFloat(formData.get("standardRateMultiplier") as string);
  const weekend = parseFloat(formData.get("weekendRateMultiplier") as string);
  const holiday = parseFloat(formData.get("holidayRateMultiplier") as string);

  if (isNaN(standard) || standard < 1 || standard > 10) return { error: "Standard rate must be between 1 and 10" };
  if (isNaN(weekend) || weekend < 1 || weekend > 10) return { error: "Weekend rate must be between 1 and 10" };
  if (isNaN(holiday) || holiday < 1 || holiday > 10) return { error: "Holiday rate must be between 1 and 10" };

  await prisma.$transaction([
    prisma.overtimeSettings.upsert({
      where: { tenantId: owner.id },
      create: { tenantId: owner.id, standardRateMultiplier: standard, weekendRateMultiplier: weekend, holidayRateMultiplier: holiday },
      update: { standardRateMultiplier: standard, weekendRateMultiplier: weekend, holidayRateMultiplier: holiday },
    }),
    prisma.overtimeSettingsLog.create({
      data: {
        tenantId: owner.id,
        changedById: session.user.id,
        standardRateMultiplier: standard,
        weekendRateMultiplier: weekend,
        holidayRateMultiplier: holiday,
      },
    }),
  ]);

  revalidatePath("/africs/settings/hr/overtime");
  return { success: true };
}
