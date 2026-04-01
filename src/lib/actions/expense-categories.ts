"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryNode = {
  id: string;
  tenantId: string | null;
  name: string;
  code: string | null;
  description: string | null;
  color: string | null;
  parentId: string | null;
  ledgerAccountId: string | null;
  ledgerAccount: { code: string; name: string } | null;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  children: CategoryNode[];
  _count: { expenses: number; billItems: number; poItems: number };
};

export type FlatCategory = Omit<CategoryNode, "children">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(
  rows: FlatCategory[],
  parentId: string | null = null
): CategoryNode[] {
  return rows
    .filter((r) => r.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((r) => ({ ...r, children: buildTree(rows, r.id) }));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Returns hierarchical tree of system + tenant categories. */
export async function getExpenseCategoryTree(
  tenantId: string
): Promise<CategoryNode[]> {
  const rows = await prisma.expenseCategory.findMany({
    where: {
      OR: [{ tenantId: null }, { tenantId }],
      isActive: true,
    },
    include: {
      ledgerAccount: { select: { code: true, name: true } },
      _count: { select: { expenses: true, billItems: true, poItems: true } },
    },
  });
  return buildTree(rows as unknown as FlatCategory[]);
}

/** Flat list of all active categories (system + tenant) — for select pickers. */
export async function getExpenseCategoriesFlat(tenantId: string): Promise<
  { id: string; name: string; code: string | null; parentId: string | null }[]
> {
  return prisma.expenseCategory.findMany({
    where: {
      OR: [{ tenantId: null }, { tenantId }],
      isActive: true,
    },
    select: { id: true, name: true, code: true, parentId: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** All categories including inactive, for management view. */
export async function getAllExpenseCategories(tenantId: string): Promise<CategoryNode[]> {
  const rows = await prisma.expenseCategory.findMany({
    where: {
      OR: [{ tenantId: null }, { tenantId }],
    },
    include: {
      ledgerAccount: { select: { code: true, name: true } },
      _count: { select: { expenses: true, billItems: true, poItems: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return buildTree(rows as unknown as FlatCategory[]);
}

// ─── Category spend report ─────────────────────────────────────────────────

export type CategorySpend = {
  categoryId: string;
  categoryName: string;
  categoryCode: string | null;
  parentName: string | null;
  expenseTotal: number;
  billTotal: number;
  total: number;
};

export async function getCategorySpendReport(
  tenantId: string,
  from: Date,
  to: Date
): Promise<CategorySpend[]> {
  const [expenses, bills] = await Promise.all([
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        tenantId,
        expenseDate: { gte: from, lte: to },
        status: { in: ["approved", "reimbursed"] },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    }),
    prisma.bill.groupBy({
      by: ["categoryId"],
      where: {
        tenantId,
        issueDate: { gte: from, lte: to },
        status: { not: "void" },
        categoryId: { not: null },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  // Collect all category ids
  const ids = new Set<string>();
  expenses.forEach((e) => e.categoryId && ids.add(e.categoryId));
  bills.forEach((b) => b.categoryId && ids.add(b.categoryId));

  if (ids.size === 0) return [];

  const cats = await prisma.expenseCategory.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      code: true,
      parent: { select: { name: true } },
    },
  });

  const catMap = new Map(cats.map((c) => [c.id, c]));

  const expMap = new Map(
    expenses.map((e) => [e.categoryId, Number(e._sum.amount ?? 0)])
  );
  const billMap = new Map(
    bills.map((b) => [b.categoryId, Number(b._sum.totalAmount ?? 0)])
  );

  return [...ids].map((id) => {
    const cat = catMap.get(id);
    const expTotal = expMap.get(id) ?? 0;
    const billTotal = billMap.get(id) ?? 0;
    return {
      categoryId: id,
      categoryName: cat?.name ?? "Unknown",
      categoryCode: cat?.code ?? null,
      parentName: cat?.parent?.name ?? null,
      expenseTotal: expTotal,
      billTotal: billTotal,
      total: expTotal + billTotal,
    };
  }).sort((a, b) => b.total - a.total);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
  ledgerAccountId: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function createExpenseCategory(
  tenantId: string,
  data: z.infer<typeof categorySchema>
) {
  const parsed = categorySchema.parse(data);
  const category = await prisma.expenseCategory.create({
    data: {
      ...parsed,
      tenantId,
      isSystem: false,
    },
  });
  revalidatePath("/africs/accounting/expense-categories");
  return category;
}

export async function updateExpenseCategory(
  tenantId: string,
  id: string,
  data: z.infer<typeof categorySchema>
) {
  // Guard: cannot modify system categories
  const existing = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!existing) throw new Error("Category not found");
  if (existing.isSystem)
    throw new Error("System categories cannot be modified");

  const parsed = categorySchema.parse(data);
  const category = await prisma.expenseCategory.update({
    where: { id },
    data: parsed,
  });
  revalidatePath("/africs/accounting/expense-categories");
  return category;
}

export async function deleteExpenseCategory(tenantId: string, id: string) {
  const existing = await prisma.expenseCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { expenses: true, billItems: true, poItems: true, children: true } },
    },
  });
  if (!existing) throw new Error("Category not found");
  if (existing.isSystem) throw new Error("System categories cannot be deleted");
  if (existing._count.children > 0)
    throw new Error("Cannot delete a category that has sub-categories");

  const usageCount =
    existing._count.expenses + existing._count.billItems + existing._count.poItems;
  if (usageCount > 0)
    throw new Error(
      `Cannot delete — this category is used by ${usageCount} record(s). Deactivate it instead.`
    );

  await prisma.expenseCategory.delete({ where: { id } });
  revalidatePath("/africs/accounting/expense-categories");
}

export async function toggleCategoryActive(tenantId: string, id: string) {
  const existing = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!existing) throw new Error("Category not found");
  if (existing.isSystem) throw new Error("System categories cannot be deactivated");

  await prisma.expenseCategory.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  revalidatePath("/africs/accounting/expense-categories");
}
