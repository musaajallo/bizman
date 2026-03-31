"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { postJournalEntry } from "./journal";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdjustmentType =
  | "accrued_expense"
  | "accrued_revenue"
  | "deferred_expense"
  | "deferred_revenue";

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  accrued_expense:   "Accrued Expense",
  accrued_revenue:   "Accrued Revenue",
  deferred_expense:  "Deferred Expense (Prepaid)",
  deferred_revenue:  "Deferred Revenue",
};

// ── Adjusting Entry CRUD ──────────────────────────────────────────────────────

export async function createAdjustingEntry(input: {
  date: string;
  description: string;
  reference?: string;
  type: AdjustmentType;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  isReversing: boolean;
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  if (!input.description?.trim()) return { error: "Description is required" };
  if (input.amount <= 0) return { error: "Amount must be greater than zero" };

  const [debitAcc, creditAcc] = await Promise.all([
    prisma.ledgerAccount.findUnique({ where: { id: input.debitAccountId }, select: { code: true } }),
    prisma.ledgerAccount.findUnique({ where: { id: input.creditAccountId }, select: { code: true } }),
  ]);
  if (!debitAcc || !creditAcc) return { error: "Invalid account selection" };

  const date = new Date(input.date);

  try {
    const entry = await postJournalEntry({
      tenantId:    owner.id,
      date,
      description: input.description.trim(),
      reference:   input.reference?.trim() || undefined,
      sourceType:  "adjusting",
      lines: [
        { accountCode: debitAcc.code,  debit:  input.amount },
        { accountCode: creditAcc.code, credit: input.amount },
      ],
    });

    // Post reversing entry if requested
    if (input.isReversing) {
      // Find the next accounting period's first day
      const currentPeriod = await prisma.accountingPeriod.findFirst({
        where: {
          tenantId:  owner.id,
          startDate: { lte: date },
          endDate:   { gte: date },
        },
      });

      if (currentPeriod) {
        const nextPeriod = await prisma.accountingPeriod.findFirst({
          where: {
            tenantId:  owner.id,
            startDate: { gt: currentPeriod.endDate },
            status:    "open",
          },
          orderBy: { startDate: "asc" },
        });

        if (nextPeriod) {
          await postJournalEntry({
            tenantId:    owner.id,
            date:        nextPeriod.startDate,
            description: `REVERSAL: ${input.description.trim()}`,
            sourceType:  "adjusting",
            lines: [
              { accountCode: creditAcc.code, debit:  input.amount },
              { accountCode: debitAcc.code,  credit: input.amount },
            ],
          });
          // Mark the reversing entry
          await prisma.journalEntry.updateMany({
            where: {
              tenantId:    owner.id,
              description: `REVERSAL: ${input.description.trim()}`,
              date:        nextPeriod.startDate,
              sourceType:  "adjusting",
            },
            data: { isReversing: true, reversesId: entry.id },
          });
        }
      }
    }

    revalidatePath("/africs/accounting/adjusting-entries");
    revalidatePath("/africs/accounting/journal-entries");
    return { success: true, id: entry.id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getAdjustingEntries(filters?: {
  periodId?: string;
  type?: AdjustmentType;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  return prisma.journalEntry.findMany({
    where: {
      tenantId:   owner.id,
      sourceType: "adjusting",
      ...(filters?.periodId ? { periodId: filters.periodId } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      lines: {
        include: { account: { select: { code: true, name: true, type: true } } },
      },
      period: { select: { name: true } },
    },
  });
}

// ── Adjusting Entry Templates ─────────────────────────────────────────────────

export async function getAdjustingTemplates() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  return prisma.adjustingEntryTemplate.findMany({
    where:   { tenantId: owner.id, isActive: true },
    orderBy: { name: "asc" },
    include: {
      debitAccount:  { select: { id: true, code: true, name: true } },
      creditAccount: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function createAdjustingTemplate(input: {
  name: string;
  type: AdjustmentType;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description: string;
  isReversing: boolean;
}): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.adjustingEntryTemplate.create({
    data: {
      tenantId:       owner.id,
      name:           input.name.trim(),
      type:           input.type,
      debitAccountId: input.debitAccountId,
      creditAccountId:input.creditAccountId,
      amount:         input.amount,
      description:    input.description.trim(),
      isReversing:    input.isReversing,
    },
  });

  revalidatePath("/africs/accounting/adjusting-entries");
  return { success: true };
}

export async function deleteAdjustingTemplate(id: string): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.adjustingEntryTemplate.update({
    where: { id, tenantId: owner.id },
    data:  { isActive: false },
  });

  revalidatePath("/africs/accounting/adjusting-entries");
  return { success: true };
}

export async function postFromTemplate(input: {
  templateId: string;
  date: string;
  periodId?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const template = await prisma.adjustingEntryTemplate.findUnique({
    where: { id: input.templateId, tenantId: owner.id },
    include: {
      debitAccount:  { select: { code: true } },
      creditAccount: { select: { code: true } },
    },
  });
  if (!template) return { error: "Template not found" };

  return createAdjustingEntry({
    date:             input.date,
    description:      template.description,
    type:             template.type as AdjustmentType,
    debitAccountId:   template.debitAccountId,
    creditAccountId:  template.creditAccountId,
    amount:           Number(template.amount),
    isReversing:      template.isReversing,
  });
}

// ── Trial Balance helper (exposes excludeAdjusting flag) ──────────────────────

export async function getTrialBalanceFiltered(asOf: Date, excludeAdjusting: boolean) {
  const owner = await getOwnerBusiness();
  if (!owner) return { rows: [], totalDebits: 0, totalCredits: 0, balanced: true };

  const accounts = await prisma.ledgerAccount.findMany({
    where:   { tenantId: owner.id, isActive: true },
    orderBy: { code: "asc" },
    include: {
      journalEntryLines: {
        where: {
          journalEntry: {
            date:       { lte: asOf },
            ...(excludeAdjusting ? { sourceType: { not: "adjusting" } } : {}),
          },
        },
        select: { debit: true, credit: true },
      },
    },
  });

  let totalDebits  = 0;
  let totalCredits = 0;

  const rows = accounts
    .map((a) => {
      const dr = a.journalEntryLines.reduce((s, l) => s + Number(l.debit),  0);
      const cr = a.journalEntryLines.reduce((s, l) => s + Number(l.credit), 0);

      const debitBalance  = a.normalBalance === "debit"  ? Math.max(dr - cr, 0) : 0;
      const creditBalance = a.normalBalance === "credit" ? Math.max(cr - dr, 0) : 0;

      totalDebits  += debitBalance;
      totalCredits += creditBalance;

      return { code: a.code, name: a.name, type: a.type, debitBalance, creditBalance };
    })
    .filter((r) => r.debitBalance !== 0 || r.creditBalance !== 0);

  return { rows, totalDebits, totalCredits, balanced: Math.abs(totalDebits - totalCredits) < 0.01 };
}
