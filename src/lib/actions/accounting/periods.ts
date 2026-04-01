"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "@/lib/actions/tenants";

export async function getAccountingPeriods() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  return prisma.accountingPeriod.findMany({
    where:   { tenantId: owner.id },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { journalEntries: true } } },
  });
}

export async function getCurrentOpenPeriod() {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  return prisma.accountingPeriod.findFirst({
    where:   { tenantId: owner.id, status: "open" },
    orderBy: { startDate: "desc" },
  });
}

export async function createAccountingPeriod(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const startDate = new Date(formData.get("startDate") as string);
  const endDate   = new Date(formData.get("endDate") as string);

  const overlap = await prisma.accountingPeriod.findFirst({
    where: {
      tenantId: owner.id,
      OR: [
        { startDate: { lte: endDate },   endDate: { gte: startDate } },
      ],
    },
  });
  if (overlap) return { error: `Dates overlap with existing period "${overlap.name}"` };

  const period = await prisma.accountingPeriod.create({
    data: {
      tenantId:   owner.id,
      name:       formData.get("name") as string,
      startDate,
      endDate,
      fiscalYear: startDate.getFullYear(),
      status:     "open",
    },
  });

  revalidatePath("/africs/accounting/periods");
  return { id: period.id };
}

export async function closePeriod(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const period = await prisma.accountingPeriod.findUnique({ where: { id, tenantId: owner.id } });
  if (!period) return { error: "Not found" };
  if (period.status !== "open") return { error: "Only open periods can be closed" };

  await prisma.accountingPeriod.update({ where: { id }, data: { status: "closed" } });

  // Auto-create the next period if none already covers those dates
  const durationMs  = period.endDate.getTime() - period.startDate.getTime();
  const nextStart   = new Date(period.endDate.getTime() + 86_400_000); // day after end
  const nextEnd     = new Date(nextStart.getTime() + durationMs);

  const overlap = await prisma.accountingPeriod.findFirst({
    where: {
      tenantId: owner.id,
      OR: [{ startDate: { lte: nextEnd }, endDate: { gte: nextStart } }],
    },
  });

  if (!overlap) {
    const autoName = nextStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    await prisma.accountingPeriod.create({
      data: {
        tenantId:   owner.id,
        name:       autoName,
        startDate:  nextStart,
        endDate:    nextEnd,
        fiscalYear: nextStart.getFullYear(),
        status:     "open",
      },
    });
  }

  revalidatePath("/africs/accounting/periods");
  return { success: true };
}

export async function lockPeriod(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const period = await prisma.accountingPeriod.findUnique({ where: { id, tenantId: owner.id } });
  if (!period) return { error: "Not found" };
  if (period.status !== "closed") return { error: "Only closed periods can be locked" };

  await prisma.accountingPeriod.update({ where: { id }, data: { status: "locked" } });
  revalidatePath("/africs/accounting/periods");
  return { success: true };
}

export async function reopenPeriod(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const period = await prisma.accountingPeriod.findUnique({ where: { id, tenantId: owner.id } });
  if (!period) return { error: "Not found" };
  if (period.status === "locked") return { error: "Locked periods cannot be reopened" };
  if (period.status === "open")   return { error: "Period is already open" };

  await prisma.accountingPeriod.update({ where: { id }, data: { status: "open" } });
  revalidatePath("/africs/accounting/periods");
  return { success: true };
}
