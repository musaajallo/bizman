"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getOwnerBusiness } from "@/lib/actions/tenants";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JournalLine {
  accountCode: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PostJournalEntryInput {
  tenantId:    string;
  date:        Date;
  description: string;
  reference?:  string;
  sourceType:  string;
  sourceId?:   string;
  lines:       JournalLine[];
  tx?:         Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
}

// ── Core posting function ─────────────────────────────────────────────────────

export async function postJournalEntry(input: PostJournalEntryInput) {
  const db = input.tx ?? prisma;

  // Resolve account codes → IDs
  const codes = input.lines.map((l) => l.accountCode);
  const accounts = await db.ledgerAccount.findMany({
    where: { tenantId: input.tenantId, code: { in: codes }, isActive: true },
    select: { id: true, code: true },
  });

  const codeToId = Object.fromEntries(accounts.map((a) => [a.code, a.id]));
  const missing = codes.filter((c) => !codeToId[c]);
  if (missing.length > 0) {
    throw new Error(`Chart of Accounts not initialized or missing accounts: ${missing.join(", ")}`);
  }

  // Validate debits = credits
  const totalDebit  = input.lines.reduce((s, l) => s + (l.debit  ?? 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Journal entry is unbalanced: debits ${totalDebit} ≠ credits ${totalCredit}`);
  }

  // Find the open accounting period for this date
  const period = await db.accountingPeriod.findFirst({
    where: {
      tenantId: input.tenantId,
      status:   "open",
      startDate: { lte: input.date },
      endDate:   { gte: input.date },
    },
  });

  if (!period) {
    // Fall back to the most recent open period rather than throwing —
    // handles cases where a transaction date slightly misses a period boundary
    const fallback = await db.accountingPeriod.findFirst({
      where: { tenantId: input.tenantId, status: "open" },
      orderBy: { startDate: "desc" },
    });
    if (!fallback) {
      throw new Error("No open accounting period found. Please open a period before posting transactions.");
    }
    return _createEntry(db, input, fallback.id, codeToId);
  }

  return _createEntry(db, input, period.id, codeToId);
}

async function _createEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  input: PostJournalEntryInput,
  periodId: string,
  codeToId: Record<string, string>,
) {
  return db.journalEntry.create({
    data: {
      tenantId:    input.tenantId,
      periodId,
      date:        input.date,
      description: input.description,
      reference:   input.reference ?? null,
      sourceType:  input.sourceType,
      sourceId:    input.sourceId ?? null,
      lines: {
        create: input.lines.map((l) => ({
          accountId:   codeToId[l.accountCode],
          debit:       l.debit  ?? 0,
          credit:      l.credit ?? 0,
          description: l.description ?? null,
        })),
      },
    },
  });
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getJournalEntries(tenantId: string, filters?: {
  periodId?: string;
  sourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  return prisma.journalEntry.findMany({
    where: {
      tenantId,
      ...(filters?.periodId   ? { periodId:   filters.periodId }   : {}),
      ...(filters?.sourceType ? { sourceType: filters.sourceType } : {}),
      ...(filters?.startDate || filters?.endDate ? {
        date: {
          ...(filters.startDate ? { gte: filters.startDate } : {}),
          ...(filters.endDate   ? { lte: filters.endDate }   : {}),
        },
      } : {}),
    },
    orderBy: { date: "desc" },
    take:    filters?.limit  ?? 100,
    skip:    filters?.offset ?? 0,
    include: {
      lines: {
        include: { account: { select: { code: true, name: true, type: true } } },
      },
      period: { select: { name: true } },
    },
  });
}

// ── General Ledger: balance per account ──────────────────────────────────────

export async function getAccountBalance(accountId: string, asOf?: Date) {
  const agg = await prisma.journalEntryLine.aggregate({
    where: {
      accountId,
      ...(asOf ? { journalEntry: { date: { lte: asOf } } } : {}),
    },
    _sum: { debit: true, credit: true },
  });

  const totalDebit  = Number(agg._sum.debit  ?? 0);
  const totalCredit = Number(agg._sum.credit ?? 0);

  return { totalDebit, totalCredit, net: totalDebit - totalCredit };
}

export async function getGeneralLedger(tenantId: string, startDate?: Date, endDate?: Date) {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: "asc" },
    include: {
      journalEntryLines: {
        where: startDate || endDate ? {
          journalEntry: {
            date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate   ? { lte: endDate }   : {}),
            },
          },
        } : undefined,
        include: {
          journalEntry: {
            select: { date: true, description: true, reference: true, sourceType: true },
          },
        },
        orderBy: { journalEntry: { date: "asc" } },
      },
    },
  });

  return accounts.map((a) => {
    const totalDebit  = a.journalEntryLines.reduce((s, l) => s + Number(l.debit),  0);
    const totalCredit = a.journalEntryLines.reduce((s, l) => s + Number(l.credit), 0);
    const balance = a.normalBalance === "debit"
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;

    return {
      id:            a.id,
      code:          a.code,
      name:          a.name,
      type:          a.type,
      normalBalance: a.normalBalance,
      isContra:      a.isContra,
      totalDebit,
      totalCredit,
      balance,
      lines:         a.journalEntryLines.map((l) => ({
        id:          l.id,
        date:        l.journalEntry.date,
        description: l.description ?? l.journalEntry.description,
        reference:   l.journalEntry.reference,
        sourceType:  l.journalEntry.sourceType,
        debit:       Number(l.debit),
        credit:      Number(l.credit),
      })),
    };
  });
}

export async function getTrialBalance(tenantId: string, asOf: Date) {
  const accounts = await prisma.ledgerAccount.findMany({
    where:   { tenantId, isActive: true },
    orderBy: { code: "asc" },
    include: {
      journalEntryLines: {
        where: { journalEntry: { date: { lte: asOf } } },
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

      // Show in normal-balance column
      const debitBalance  = a.normalBalance === "debit"  ? Math.max(dr - cr, 0) : 0;
      const creditBalance = a.normalBalance === "credit" ? Math.max(cr - dr, 0) : 0;

      totalDebits  += debitBalance;
      totalCredits += creditBalance;

      return { code: a.code, name: a.name, type: a.type, debitBalance, creditBalance };
    })
    .filter((r) => r.debitBalance !== 0 || r.creditBalance !== 0);

  return { rows, totalDebits, totalCredits, balanced: Math.abs(totalDebits - totalCredits) < 0.01 };
}

// ── Owner-scoped convenience wrappers ────────────────────────────────────────

export async function getOwnerJournalEntries(filters?: Parameters<typeof getJournalEntries>[1]) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];
  return getJournalEntries(owner.id, filters);
}

export async function getOwnerGeneralLedger(startDate?: Date, endDate?: Date) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];
  return getGeneralLedger(owner.id, startDate, endDate);
}

export async function getOwnerTrialBalance(asOf: Date) {
  const owner = await getOwnerBusiness();
  if (!owner) return { rows: [], totalDebits: 0, totalCredits: 0, balanced: true };
  return getTrialBalance(owner.id, asOf);
}
