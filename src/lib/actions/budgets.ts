"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

function toNum(d: unknown): number {
  if (d == null) return 0;
  return Number(d);
}

function serializeBudget(b: {
  id: string; tenantId: string; name: string; description: string | null;
  startDate: Date; endDate: Date; currency: string; status: string;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...b,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ── Pull actuals from expenses, bills, payroll ────────────────────────────────

async function getActualsForPeriod(tenantId: string, startDate: Date, endDate: Date) {
  const [expenses, bills, payrollRuns] = await Promise.all([
    prisma.expense.findMany({
      where: { tenantId, expenseDate: { gte: startDate, lte: endDate }, status: { notIn: ["rejected"] } },
      select: { amount: true, category: { select: { name: true } } },
    }),
    prisma.bill.findMany({
      where: { tenantId, issueDate: { gte: startDate, lte: endDate } },
      select: { totalAmount: true },
    }),
    prisma.payrollRun.findMany({
      where: { tenantId, paidAt: { gte: startDate, lte: endDate }, status: "paid" },
      select: { totalGross: true },
    }),
  ]);

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    const key = e.category?.name ?? "Uncategorized";
    byCategory[key] = (byCategory[key] ?? 0) + toNum(e.amount);
  }

  const totalExpenses = expenses.reduce((s, e) => s + toNum(e.amount), 0);
  const totalBills = bills.reduce((s, b) => s + toNum(b.totalAmount), 0);
  const totalPayroll = payrollRuns.reduce((s, p) => s + toNum(p.totalGross), 0);

  return { byCategory, totalExpenses, totalBills, totalPayroll, grand: totalExpenses + totalBills + totalPayroll };
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function getBudgets() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const budgets = await prisma.budget.findMany({
    where: { tenantId: owner.id },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { lines: true } } },
  });

  return budgets.map((b) => ({ ...serializeBudget(b), _count: b._count }));
}

export async function getBudgetById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const b = await prisma.budget.findUnique({
    where: { id, tenantId: owner.id },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!b) return null;

  // Pull actuals for budget period
  const actuals = await getActualsForPeriod(owner.id, b.startDate, b.endDate);

  const totalAllocated = b.lines.reduce((s, l) => s + toNum(l.allocatedAmount), 0);

  return {
    ...serializeBudget(b),
    lines: b.lines.map((l) => ({
      ...l,
      allocatedAmount: toNum(l.allocatedAmount),
      actual: actuals.byCategory[l.reference ?? l.label] ?? 0,
    })),
    totalAllocated,
    actuals,
  };
}

export async function createBudget(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const budget = await prisma.budget.create({
    data: {
      tenantId: owner.id,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      currency: (formData.get("currency") as string) || "GMD",
      status: "draft",
    },
  });

  revalidatePath("/africs/accounting/budgets");
  return { id: budget.id };
}

export async function updateBudgetStatus(id: string, status: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.budget.update({ where: { id, tenantId: owner.id }, data: { status } });
  revalidatePath("/africs/accounting/budgets");
  revalidatePath(`/africs/accounting/budgets/${id}`);
  return { success: true };
}

export async function deleteBudget(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.budget.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/accounting/budgets");
  return { success: true };
}

// ── Budget Lines ──────────────────────────────────────────────────────────────

export async function addBudgetLine(budgetId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const budget = await prisma.budget.findUnique({ where: { id: budgetId, tenantId: owner.id } });
  if (!budget) return { error: "Budget not found" };

  await prisma.budgetLine.create({
    data: {
      budgetId,
      tenantId: owner.id,
      label: formData.get("label") as string,
      lineType: (formData.get("lineType") as string) || "category",
      reference: (formData.get("reference") as string) || null,
      allocatedAmount: parseFloat(formData.get("allocatedAmount") as string),
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/africs/accounting/budgets/${budgetId}`);
  return { success: true };
}

export async function updateBudgetLine(id: string, budgetId: string, allocatedAmount: number) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.budgetLine.update({
    where: { id, tenantId: owner.id },
    data: { allocatedAmount },
  });
  revalidatePath(`/africs/accounting/budgets/${budgetId}`);
  return { success: true };
}

export async function deleteBudgetLine(id: string, budgetId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.budgetLine.delete({ where: { id, tenantId: owner.id } });
  revalidatePath(`/africs/accounting/budgets/${budgetId}`);
  return { success: true };
}

export async function getBudgetExportData(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const b = await prisma.budget.findUnique({
    where: { id, tenantId: owner.id },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!b) return null;

  const actuals = await getActualsForPeriod(owner.id, b.startDate, b.endDate);
  const lines = b.lines.map((l) => {
    const allocated = toNum(l.allocatedAmount);
    const actual = actuals.byCategory[l.reference ?? l.label] ?? 0;
    return { label: l.label, lineType: l.lineType, allocated, actual, variance: allocated - actual };
  });

  return {
    name: b.name,
    description: b.description,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    currency: b.currency,
    status: b.status,
    lines,
    totals: {
      allocated: lines.reduce((s, l) => s + l.allocated, 0),
      actual: lines.reduce((s, l) => s + l.actual, 0),
    },
    actuals,
  };
}
