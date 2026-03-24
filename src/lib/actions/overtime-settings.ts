"use server";

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

export async function updateOvertimeSettings(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const standard = parseFloat(formData.get("standardRateMultiplier") as string);
  const weekend = parseFloat(formData.get("weekendRateMultiplier") as string);
  const holiday = parseFloat(formData.get("holidayRateMultiplier") as string);

  if (isNaN(standard) || standard < 1 || standard > 10) return { error: "Standard rate must be between 1 and 10" };
  if (isNaN(weekend) || weekend < 1 || weekend > 10) return { error: "Weekend rate must be between 1 and 10" };
  if (isNaN(holiday) || holiday < 1 || holiday > 10) return { error: "Holiday rate must be between 1 and 10" };

  await prisma.overtimeSettings.upsert({
    where: { tenantId: owner.id },
    create: {
      tenantId: owner.id,
      standardRateMultiplier: standard,
      weekendRateMultiplier: weekend,
      holidayRateMultiplier: holiday,
    },
    update: {
      standardRateMultiplier: standard,
      weekendRateMultiplier: weekend,
      holidayRateMultiplier: holiday,
    },
  });

  revalidatePath("/africs/settings/hr/overtime");
  return { success: true };
}
