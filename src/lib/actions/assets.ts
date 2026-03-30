"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "./tenants";
import { postJournalEntry } from "./accounting/journal";
import { calculatePeriodDepreciation } from "@/lib/depreciation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

async function generateAssetNumber(tenantId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const settings = await tx.assetSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
    await tx.assetSettings.update({
      where: { tenantId },
      data: { nextAssetNumber: { increment: 1 } },
    });
    return `${settings.assetPrefix}-${String(settings.nextAssetNumber).padStart(4, "0")}`;
  });
}

function serializeAsset(a: {
  id: string; tenantId: string; assetNumber: string; name: string; description: string | null;
  category: string; status: string; serialNumber: string | null; brand: string | null;
  model: string | null; location: string | null; purchaseDate: Date | null;
  purchasePrice: unknown; currency: string; warrantyExpiry: Date | null;
  condition: string; currentValue: unknown; depreciationMethod: string | null;
  usefulLifeMonths: number | null; salvageValue: unknown; notes: string | null;
  purchaseOrderId: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    ...a,
    purchasePrice: toNum(a.purchasePrice),
    currentValue: toNum(a.currentValue),
    salvageValue: toNum(a.salvageValue),
    purchaseDate: a.purchaseDate?.toISOString() ?? null,
    warrantyExpiry: a.warrantyExpiry?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ── Asset queries ─────────────────────────────────────────────────────────────

export async function getAssets(filters?: { status?: string; category?: string; search?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { assetNumber: { contains: filters.search, mode: "insensitive" } },
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignments: {
        where: { returnedDate: null },
        include: { employee: { select: { id: true, firstName: true, lastName: true } } },
        take: 1,
        orderBy: { assignedDate: "desc" },
      },
    },
  });

  return assets.map((a) => ({
    ...serializeAsset(a),
    currentAssignment: a.assignments[0] ?? null,
  }));
}

export async function getAsset(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const asset = await prisma.asset.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      purchaseOrder: { select: { id: true, poNumber: true } },
      assignments: {
        orderBy: { assignedDate: "desc" },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
          assignedBy: { select: { name: true } },
        },
      },
      maintenance: { orderBy: { maintenanceDate: "desc" } },
      depreciationEntries: {
        orderBy: { date: "asc" },
        include: { period: { select: { name: true } } },
      },
    },
  });
  if (!asset) return null;

  return {
    ...serializeAsset(asset),
    disposedAt: asset.disposedAt?.toISOString() ?? null,
    disposalProceeds: toNum(asset.disposalProceeds),
    disposalNotes: asset.disposalNotes,
    purchaseOrder: asset.purchaseOrder,
    assignments: asset.assignments.map((a) => ({
      ...a,
      assignedDate: a.assignedDate.toISOString(),
      returnedDate: a.returnedDate?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    maintenance: asset.maintenance.map((m) => ({
      ...m,
      cost: toNum(m.cost),
      maintenanceDate: m.maintenanceDate.toISOString(),
      nextMaintenanceDate: m.nextMaintenanceDate?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    depreciationEntries: asset.depreciationEntries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      periodName: e.period.name,
      amount: toNum(e.amount),
      accumulatedTotal: toNum(e.accumulatedTotal),
      journalEntryId: e.journalEntryId,
    })),
  };
}

export async function getAssetStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { total: 0, active: 0, inMaintenance: 0, totalValue: 0, byCategory: {} };

  const [counts, valueAgg] = await Promise.all([
    prisma.asset.groupBy({
      by: ["status"],
      where: { tenantId: owner.id },
      _count: true,
    }),
    prisma.asset.aggregate({
      where: { tenantId: owner.id, status: { not: "disposed" } },
      _sum: { currentValue: true, purchasePrice: true },
    }),
  ]);

  const map = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  return {
    total: counts.reduce((s, c) => s + c._count, 0),
    active: map.active ?? 0,
    inMaintenance: map.in_maintenance ?? 0,
    totalValue: toNum(valueAgg._sum.currentValue) || toNum(valueAgg._sum.purchasePrice),
  };
}

// ── Asset mutations ───────────────────────────────────────────────────────────

export async function createAsset(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const assetNumber = await generateAssetNumber(owner.id);
  const purchasePrice = formData.get("purchasePrice") ? parseFloat(formData.get("purchasePrice") as string) : null;
  const salvageValue = formData.get("salvageValue") ? parseFloat(formData.get("salvageValue") as string) : null;

  const category = (formData.get("category") as string) || "equipment";
  const purchaseDateRaw = formData.get("purchaseDate") as string | null;
  const purchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : null;

  const asset = await prisma.asset.create({
    data: {
      tenantId: owner.id,
      assetNumber,
      name,
      description: (formData.get("description") as string)?.trim() || null,
      category,
      serialNumber: (formData.get("serialNumber") as string)?.trim() || null,
      brand: (formData.get("brand") as string)?.trim() || null,
      model: (formData.get("model") as string)?.trim() || null,
      location: (formData.get("location") as string)?.trim() || null,
      purchaseDate,
      purchasePrice,
      currency: (formData.get("currency") as string) || "GMD",
      warrantyExpiry: formData.get("warrantyExpiry") ? new Date(formData.get("warrantyExpiry") as string) : null,
      condition: (formData.get("condition") as string) || "good",
      currentValue: purchasePrice,
      depreciationMethod: (formData.get("depreciationMethod") as string) || null,
      usefulLifeMonths: formData.get("usefulLifeMonths") ? parseInt(formData.get("usefulLifeMonths") as string, 10) : null,
      salvageValue,
      notes: (formData.get("notes") as string)?.trim() || null,
      purchaseOrderId: (formData.get("purchaseOrderId") as string) || null,
    },
  });

  // Post purchase journal entry if a purchase price is set
  if (purchasePrice && purchasePrice > 0) {
    const assetAccount = category === "intangibles" ? "1600" : "1500";
    try {
      await postJournalEntry({
        tenantId: owner.id,
        date: purchaseDate ?? new Date(),
        description: `Asset purchased — ${assetNumber} (${name})`,
        reference: assetNumber,
        sourceType: "asset",
        sourceId: asset.id,
        lines: [
          { accountCode: assetAccount, debit: purchasePrice, description: `${name} — PP&E` },
          { accountCode: "1000", credit: purchasePrice, description: "Cash/Bank" },
        ],
      });
    } catch {
      // Journal posting failure is non-fatal (e.g. no open period yet)
    }
  }

  revalidatePath("/africs/accounting/assets");
  return { success: true, id: asset.id };
}

export async function updateAsset(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const purchasePrice = formData.get("purchasePrice") ? parseFloat(formData.get("purchasePrice") as string) : null;
  const salvageValue = formData.get("salvageValue") ? parseFloat(formData.get("salvageValue") as string) : null;

  await prisma.asset.updateMany({
    where: { id, tenantId: owner.id },
    data: {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      category: (formData.get("category") as string) || "equipment",
      serialNumber: (formData.get("serialNumber") as string)?.trim() || null,
      brand: (formData.get("brand") as string)?.trim() || null,
      model: (formData.get("model") as string)?.trim() || null,
      location: (formData.get("location") as string)?.trim() || null,
      purchaseDate: formData.get("purchaseDate") ? new Date(formData.get("purchaseDate") as string) : null,
      purchasePrice,
      currency: (formData.get("currency") as string) || "GMD",
      warrantyExpiry: formData.get("warrantyExpiry") ? new Date(formData.get("warrantyExpiry") as string) : null,
      condition: (formData.get("condition") as string) || "good",
      depreciationMethod: (formData.get("depreciationMethod") as string) || null,
      usefulLifeMonths: formData.get("usefulLifeMonths") ? parseInt(formData.get("usefulLifeMonths") as string, 10) : null,
      salvageValue,
      notes: (formData.get("notes") as string)?.trim() || null,
    },
  });

  revalidatePath("/africs/accounting/assets");
  revalidatePath(`/africs/accounting/assets/${id}`);
  return { success: true };
}

export async function deleteAsset(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const active = await prisma.assetAssignment.count({ where: { assetId: id, returnedDate: null } });
  if (active > 0) return { error: "Return the asset before deleting it" };

  await prisma.asset.deleteMany({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/accounting/assets");
  return { success: true };
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function assignAsset(assetId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const employeeId = (formData.get("employeeId") as string) || null;
  const location = (formData.get("location") as string)?.trim() || null;

  if (!employeeId && !location) return { error: "Select an employee or enter a location" };

  // Return current active assignment if any
  await prisma.assetAssignment.updateMany({
    where: { assetId, returnedDate: null },
    data: { returnedDate: new Date() },
  });

  await prisma.assetAssignment.create({
    data: {
      assetId,
      employeeId,
      location,
      notes: (formData.get("notes") as string)?.trim() || null,
      assignedById: session.user.id,
    },
  });

  revalidatePath(`/africs/accounting/assets/${assetId}`);
  return { success: true };
}

export async function returnAsset(assignmentId: string, assetId: string) {
  await prisma.assetAssignment.update({
    where: { id: assignmentId },
    data: { returnedDate: new Date() },
  });
  revalidatePath(`/africs/accounting/assets/${assetId}`);
  return { success: true };
}

// ── Maintenance ───────────────────────────────────────────────────────────────

export async function createMaintenance(assetId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const maintenanceDateRaw = formData.get("maintenanceDate") as string;
  if (!maintenanceDateRaw) return { error: "Date is required" };

  await prisma.assetMaintenance.create({
    data: {
      assetId,
      title,
      description: (formData.get("description") as string)?.trim() || null,
      maintenanceDate: new Date(maintenanceDateRaw),
      nextMaintenanceDate: formData.get("nextMaintenanceDate") ? new Date(formData.get("nextMaintenanceDate") as string) : null,
      cost: formData.get("cost") ? parseFloat(formData.get("cost") as string) : null,
      currency: (formData.get("currency") as string) || "GMD",
      performedBy: (formData.get("performedBy") as string)?.trim() || null,
      status: (formData.get("status") as string) || "completed",
    },
  });

  // If status is in_maintenance or scheduled, update asset status
  const status = formData.get("status") as string;
  if (status === "in_progress" || status === "scheduled") {
    await prisma.asset.update({ where: { id: assetId }, data: { status: "in_maintenance" } });
  } else if (status === "completed") {
    await prisma.asset.update({ where: { id: assetId }, data: { status: "active" } });
  }

  revalidatePath(`/africs/accounting/assets/${assetId}`);
  return { success: true };
}

export async function deleteMaintenance(id: string, assetId: string) {
  await prisma.assetMaintenance.delete({ where: { id } });
  revalidatePath(`/africs/accounting/assets/${assetId}`);
  return { success: true };
}

export async function getUpcomingMaintenance() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  return prisma.assetMaintenance.findMany({
    where: {
      asset: { tenantId: owner.id },
      nextMaintenanceDate: { lte: thirtyDaysOut, gte: new Date() },
    },
    include: { asset: { select: { id: true, name: true, assetNumber: true } } },
    orderBy: { nextMaintenanceDate: "asc" },
  });
}

// ── Depreciation ─────────────────────────────────────────────────────────────

export async function getAssetDepreciationHistory(assetId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const entries = await prisma.assetDepreciationEntry.findMany({
    where: { assetId, tenantId: owner.id },
    include: { period: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  return entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    periodName: e.period.name,
    amount: toNum(e.amount),
    accumulatedTotal: toNum(e.accumulatedTotal),
    journalEntryId: e.journalEntryId,
    notes: e.notes,
  }));
}

export async function depreciateAsset(
  assetId: string,
  periodId: string,
): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const [asset, period] = await Promise.all([
    prisma.asset.findFirst({ where: { id: assetId, tenantId: owner.id } }),
    prisma.accountingPeriod.findFirst({ where: { id: periodId, tenantId: owner.id } }),
  ]);

  if (!asset) return { error: "Asset not found" };
  if (!period) return { error: "Period not found" };
  if (period.status !== "open") return { error: "Period is not open" };
  if (asset.status === "disposed") return { error: "Asset is already disposed" };
  if (!asset.depreciationMethod || asset.depreciationMethod === "none") return { error: "No depreciation method set" };
  if (!asset.usefulLifeMonths || !asset.purchasePrice) return { error: "Missing useful life or purchase price" };

  // Check already depreciated this period
  const existing = await prisma.assetDepreciationEntry.findUnique({
    where: { assetId_periodId: { assetId, periodId } },
  });
  if (existing) return { error: "Already depreciated for this period" };

  // Calculate accumulated depreciation so far
  const accAgg = await prisma.assetDepreciationEntry.aggregate({
    where: { assetId },
    _sum: { amount: true },
  });
  const accumulated = toNum(accAgg._sum.amount);

  const amount = calculatePeriodDepreciation({
    cost: toNum(asset.purchasePrice),
    salvageValue: toNum(asset.salvageValue),
    usefulLifeMonths: asset.usefulLifeMonths,
    method: asset.depreciationMethod,
    purchaseDate: asset.purchaseDate ?? new Date(),
    periodDate: period.startDate,
    accumulatedDepreciation: accumulated,
  });

  if (amount <= 0) return { error: "Asset is fully depreciated" };

  const newAccumulated = accumulated + amount;
  const newBookValue = toNum(asset.purchasePrice) - newAccumulated;

  await prisma.$transaction(async (tx) => {
    // Post journal entry
    const je = await postJournalEntry({
      tenantId: owner.id,
      date: period.startDate,
      description: `Depreciation — ${asset.assetNumber} (${asset.name})`,
      reference: asset.assetNumber,
      sourceType: "asset_depreciation",
      sourceId: asset.id,
      lines: [
        { accountCode: "6500", debit: amount, description: "Depreciation Expense" },
        { accountCode: "1510", credit: amount, description: "Accumulated Depreciation" },
      ],
      tx,
    });

    await tx.assetDepreciationEntry.create({
      data: {
        assetId,
        tenantId: owner.id,
        periodId,
        date: period.startDate,
        amount,
        accumulatedTotal: newAccumulated,
        journalEntryId: je.id,
      },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: { currentValue: Math.max(newBookValue, toNum(asset.salvageValue)) },
    });
  });

  revalidatePath(`/africs/accounting/assets/${assetId}`);
  revalidatePath("/africs/accounting/assets");
  return { success: true };
}

export async function runMonthlyDepreciation(
  periodId: string,
): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { processed: 0, skipped: 0, errors: ["No business found"] };

  const period = await prisma.accountingPeriod.findFirst({ where: { id: periodId, tenantId: owner.id } });
  if (!period) return { processed: 0, skipped: 0, errors: ["Period not found"] };
  if (period.status !== "open") return { processed: 0, skipped: 0, errors: ["Period is not open"] };

  const assets = await prisma.asset.findMany({
    where: {
      tenantId: owner.id,
      status: { notIn: ["disposed"] },
      depreciationMethod: { not: null, notIn: ["none"] },
      usefulLifeMonths: { not: null },
      purchasePrice: { not: null },
    },
  });

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const a of assets) {
    const result = await depreciateAsset(a.id, periodId);
    if (result.success) {
      processed++;
    } else if (result.error === "Already depreciated for this period" || result.error === "Asset is fully depreciated") {
      skipped++;
    } else {
      errors.push(`${a.assetNumber}: ${result.error}`);
    }
  }

  revalidatePath("/africs/accounting/assets");
  return { processed, skipped, errors };
}

// ── Disposal ──────────────────────────────────────────────────────────────────

export async function disposeAsset(
  assetId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const asset = await prisma.asset.findFirst({ where: { id: assetId, tenantId: owner.id } });
  if (!asset) return { error: "Asset not found" };
  if (asset.status === "disposed") return { error: "Asset is already disposed" };

  const proceeds = formData.get("proceeds") ? parseFloat(formData.get("proceeds") as string) : 0;
  const disposalDate = formData.get("disposalDate")
    ? new Date(formData.get("disposalDate") as string)
    : new Date();
  const disposalNotes = (formData.get("notes") as string)?.trim() || null;

  const accAgg = await prisma.assetDepreciationEntry.aggregate({
    where: { assetId },
    _sum: { amount: true },
  });
  const accumulatedDepreciation = toNum(accAgg._sum.amount);
  const cost = toNum(asset.purchasePrice);
  const bookValue = cost - accumulatedDepreciation;
  const gainOrLoss = proceeds - bookValue;

  await prisma.$transaction(async (tx) => {
    const lines = [
      // Remove accumulated depreciation (debit the contra account)
      ...(accumulatedDepreciation > 0
        ? [{ accountCode: "1510", debit: accumulatedDepreciation, description: "Remove accumulated depreciation" }]
        : []),
      // Remove asset at cost (credit PP&E or intangibles)
      { accountCode: asset.category === "intangibles" ? "1600" : "1500", credit: cost, description: "Remove asset at cost" },
    ];

    if (proceeds > 0) {
      lines.push({ accountCode: "1000", debit: proceeds, description: "Disposal proceeds received" });
    }

    if (gainOrLoss > 0.01) {
      lines.push({ accountCode: "4400", credit: gainOrLoss, description: "Gain on disposal" });
    } else if (gainOrLoss < -0.01) {
      lines.push({ accountCode: "7100", debit: Math.abs(gainOrLoss), description: "Loss on disposal" });
    } else if (proceeds === 0 && accumulatedDepreciation === 0) {
      // No proceeds, no accumulated depreciation — add a balancing loss entry
      lines.push({ accountCode: "7100", debit: cost, description: "Loss on disposal (no proceeds)" });
    }

    const je = await postJournalEntry({
      tenantId: owner.id,
      date: disposalDate,
      description: `Asset disposed — ${asset.assetNumber} (${asset.name})`,
      reference: asset.assetNumber,
      sourceType: "asset_disposal",
      sourceId: asset.id,
      lines,
      tx,
    });

    await tx.asset.update({
      where: { id: assetId },
      data: {
        status: "disposed",
        disposedAt: disposalDate,
        disposalProceeds: proceeds,
        disposalNotes,
        disposalJournalEntryId: je.id,
        currentValue: 0,
      },
    });
  });

  revalidatePath(`/africs/accounting/assets/${assetId}`);
  revalidatePath("/africs/accounting/assets");
  return { success: true };
}

export async function getOpenPeriods() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];
  return prisma.accountingPeriod.findMany({
    where: { tenantId: owner.id, status: "open" },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, startDate: true, endDate: true },
  });
}
