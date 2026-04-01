"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";
import { auth } from "@/lib/auth";
import { postJournalEntry } from "@/lib/actions/accounting/journal";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  return session.user.id;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getExpenses(filters?: {
  status?: string;
  categoryId?: string;
  employeeId?: string;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.employeeId) where.employeeId = filters.employeeId;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { name: true, code: true } },
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
    },
  });

  return expenses.map((e) => ({
    ...e,
    amount: toNum(e.amount),
    expenseDate: e.expenseDate.toISOString(),
    reviewedAt: e.reviewedAt?.toISOString() ?? null,
    reimbursedAt: e.reimbursedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
}

export async function getExpense(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const e = await prisma.expense.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      category: true,
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true, jobTitle: true },
      },
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!e) return null;

  return {
    ...e,
    amount: toNum(e.amount),
    expenseDate: e.expenseDate.toISOString(),
    reviewedAt: e.reviewedAt?.toISOString() ?? null,
    reimbursedAt: e.reimbursedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function getExpenseStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { totalCount: 0, totalAmount: 0, pendingCount: 0, pendingAmount: 0, approvedCount: 0, approvedAmount: 0, reimbursedCount: 0, reimbursedAmount: 0 };

  const [all, pending, approved, reimbursed] = await Promise.all([
    prisma.expense.aggregate({ where: { tenantId: owner.id }, _count: true, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { tenantId: owner.id, status: "submitted" }, _count: true, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { tenantId: owner.id, status: "approved" }, _count: true, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { tenantId: owner.id, status: "reimbursed" }, _count: true, _sum: { amount: true } }),
  ]);

  return {
    totalCount: all._count,
    totalAmount: toNum(all._sum.amount),
    pendingCount: pending._count,
    pendingAmount: toNum(pending._sum.amount),
    approvedCount: approved._count,
    approvedAmount: toNum(approved._sum.amount),
    reimbursedCount: reimbursed._count,
    reimbursedAmount: toNum(reimbursed._sum.amount),
  };
}

export async function getExpenseCategories() {
  const owner = await getOwnerBusiness();
  return prisma.expenseCategory.findMany({
    where: { OR: [{ tenantId: null }, { tenantId: owner?.id }], isActive: true },
    select: { id: true, name: true, code: true, parentId: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createExpense(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };
  const userId = await getSession();

  const title = (formData.get("title") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string);
  const currency = (formData.get("currency") as string) || "USD";
  const categoryId = formData.get("categoryId") as string;
  const expenseDate = formData.get("expenseDate") as string;
  const description = (formData.get("description") as string) || null;
  const employeeId = (formData.get("employeeId") as string) || null;
  const receiptUrl = (formData.get("receiptUrl") as string) || null;

  if (!title) return { error: "Title is required" };
  if (isNaN(amount) || amount <= 0) return { error: "A valid amount is required" };
  if (!categoryId) return { error: "Category is required" };
  if (!expenseDate) return { error: "Date is required" };

  const expense = await prisma.expense.create({
    data: {
      tenantId: owner.id,
      submittedById: userId,
      employeeId,
      title,
      description,
      amount,
      currency,
      categoryId,
      expenseDate: new Date(expenseDate),
      receiptUrl,
      status: "draft",
    },
  });

  revalidatePath("/africs/accounting/expenses");
  return { id: expense.id };
}

export async function updateExpense(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const expense = await prisma.expense.findFirst({ where: { id, tenantId: owner.id } });
  if (!expense) return { error: "Not found" };
  if (expense.status !== "draft") return { error: "Only draft expenses can be edited" };

  const title = (formData.get("title") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string);
  const currency = (formData.get("currency") as string) || "USD";
  const categoryId = formData.get("categoryId") as string;
  const expenseDate = formData.get("expenseDate") as string;
  const description = (formData.get("description") as string) || null;
  const employeeId = (formData.get("employeeId") as string) || null;
  const receiptUrl = (formData.get("receiptUrl") as string) || null;

  if (!title) return { error: "Title is required" };
  if (isNaN(amount) || amount <= 0) return { error: "A valid amount is required" };

  await prisma.expense.update({
    where: { id },
    data: { title, description, amount, currency, categoryId, expenseDate: new Date(expenseDate), employeeId, receiptUrl },
  });

  revalidatePath("/africs/accounting/expenses");
  revalidatePath(`/africs/accounting/expenses/${id}`);
  return { success: true };
}

export async function submitExpense(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const expense = await prisma.expense.findFirst({ where: { id, tenantId: owner.id } });
  if (!expense) return { error: "Not found" };
  if (expense.status !== "draft") return { error: "Only draft expenses can be submitted" };

  await prisma.expense.update({ where: { id }, data: { status: "submitted" } });
  revalidatePath(`/africs/accounting/expenses/${id}`);
  revalidatePath("/africs/accounting/expenses");
  return { success: true };
}

export async function approveExpense(id: string, notes?: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };
  const userId = await getSession();

  const expense = await prisma.expense.findFirst({ where: { id, tenantId: owner.id } });
  if (!expense) return { error: "Not found" };
  if (expense.status !== "submitted") return { error: "Only submitted expenses can be approved" };

  await prisma.expense.update({
    where: { id },
    data: { status: "approved", reviewedById: userId, reviewedAt: new Date(), notes: notes || null },
  });

  revalidatePath(`/africs/accounting/expenses/${id}`);
  revalidatePath("/africs/accounting/expenses");
  return { success: true };
}

export async function rejectExpense(id: string, notes: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };
  const userId = await getSession();

  if (!notes?.trim()) return { error: "A reason is required when rejecting an expense" };

  const expense = await prisma.expense.findFirst({ where: { id, tenantId: owner.id } });
  if (!expense) return { error: "Not found" };
  if (expense.status !== "submitted") return { error: "Only submitted expenses can be rejected" };

  await prisma.expense.update({
    where: { id },
    data: { status: "rejected", reviewedById: userId, reviewedAt: new Date(), notes },
  });

  revalidatePath(`/africs/accounting/expenses/${id}`);
  revalidatePath("/africs/accounting/expenses");
  return { success: true };
}

export async function markReimbursed(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const expense = await prisma.expense.findFirst({ where: { id, tenantId: owner.id } });
  if (!expense) return { error: "Not found" };
  if (expense.status !== "approved") return { error: "Only approved expenses can be marked as reimbursed" };

  const reimbursedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({ where: { id }, data: { status: "reimbursed", reimbursedAt } });

    const amount = Number(expense.amount);
    if (amount > 0) {
      await postJournalEntry({
        tenantId: owner.id,
        date: reimbursedAt,
        description: `Expense reimbursed — ${expense.title}`,
        sourceType: "expense",
        sourceId: id,
        lines: [
          { accountCode: "6200", debit: amount, description: expense.title },
          { accountCode: "1000", credit: amount, description: "Cash/Bank" },
        ],
        tx,
      });
    }
  });

  revalidatePath(`/africs/accounting/expenses/${id}`);
  revalidatePath("/africs/accounting/expenses");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const expense = await prisma.expense.findFirst({ where: { id, tenantId: owner.id } });
  if (!expense) return { error: "Not found" };
  if (!["draft", "rejected"].includes(expense.status)) return { error: "Only draft or rejected expenses can be deleted" };

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/africs/accounting/expenses");
  return { success: true };
}
