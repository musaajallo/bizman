"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { postJournalEntry } from "./journal";

function toNum(d: unknown): number {
  return Number(d ?? 0);
}

// ── Bank Accounts ─────────────────────────────────────────────────────────────

export async function getBankAccounts() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const accounts = await prisma.bankAccount.findMany({
    where: { tenantId: owner.id },
    orderBy: { name: "asc" },
    include: {
      ledgerAccount: { select: { code: true, name: true } },
      statements: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, updatedAt: true },
      },
    },
  });

  // Check for stale unreconciled items (> 90 days old)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    accountNumber: a.accountNumber,
    bankName: a.bankName,
    currency: a.currency,
    ledgerAccountId: a.ledgerAccountId,
    ledgerAccount: a.ledgerAccount,
    isActive: a.isActive,
    lastStatement: a.statements[0]
      ? { status: a.statements[0].status, updatedAt: a.statements[0].updatedAt.toISOString() }
      : null,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getLedgerCashAccounts() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];
  return prisma.ledgerAccount.findMany({
    where: { tenantId: owner.id, type: "Asset", isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function createBankAccount(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const accountNumber = (formData.get("accountNumber") as string)?.trim();
  if (!accountNumber) return { error: "Account number is required" };

  try {
    const acct = await prisma.bankAccount.create({
      data: {
        tenantId: owner.id,
        name,
        accountNumber,
        bankName: (formData.get("bankName") as string)?.trim() || null,
        currency: (formData.get("currency") as string) || "GMD",
        ledgerAccountId: (formData.get("ledgerAccountId") as string) || null,
      },
    });
    revalidatePath("/africs/accounting/bank-reconciliation");
    return { success: true, id: acct.id };
  } catch {
    return { error: "Account number already exists" };
  }
}

export async function updateBankAccount(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.bankAccount.updateMany({
    where: { id, tenantId: owner.id },
    data: {
      name: (formData.get("name") as string)?.trim(),
      bankName: (formData.get("bankName") as string)?.trim() || null,
      currency: (formData.get("currency") as string) || "GMD",
      ledgerAccountId: (formData.get("ledgerAccountId") as string) || null,
    },
  });

  revalidatePath("/africs/accounting/bank-reconciliation");
  return { success: true };
}

export async function toggleBankAccountActive(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };
  const acct = await prisma.bankAccount.findFirst({ where: { id, tenantId: owner.id } });
  if (!acct) return { error: "Not found" };
  await prisma.bankAccount.update({ where: { id }, data: { isActive: !acct.isActive } });
  revalidatePath("/africs/accounting/bank-reconciliation");
  return { success: true };
}

// ── Bank Statements ───────────────────────────────────────────────────────────

export async function getBankAccountWithStatements(bankAccountId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const acct = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, tenantId: owner.id },
    include: {
      ledgerAccount: { select: { code: true, name: true } },
      statements: {
        orderBy: { createdAt: "desc" },
        include: {
          period: { select: { name: true, startDate: true, endDate: true } },
          _count: { select: { lines: true } },
        },
      },
    },
  });
  if (!acct) return null;

  return {
    ...acct,
    statements: acct.statements.map((s) => ({
      id: s.id,
      periodId: s.periodId,
      periodName: s.period.name,
      periodStart: s.period.startDate.toISOString(),
      periodEnd: s.period.endDate.toISOString(),
      openingBalance: toNum(s.openingBalance),
      closingBalance: toNum(s.closingBalance),
      status: s.status,
      lineCount: s._count.lines,
      reconciledAt: s.reconciledAt?.toISOString() ?? null,
      confirmedAt: s.confirmedAt?.toISOString() ?? null,
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}

export async function createStatement(bankAccountId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const acct = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, tenantId: owner.id } });
  if (!acct) return { error: "Bank account not found" };

  const periodId = formData.get("periodId") as string;
  if (!periodId) return { error: "Period is required" };

  const openingBalance = parseFloat(formData.get("openingBalance") as string) || 0;
  const closingBalance = parseFloat(formData.get("closingBalance") as string) || 0;

  try {
    const stmt = await prisma.bankStatement.create({
      data: {
        tenantId: owner.id,
        bankAccountId,
        periodId,
        openingBalance,
        closingBalance,
        status: "draft",
      },
    });
    revalidatePath(`/africs/accounting/bank-reconciliation/${bankAccountId}`);
    return { success: true, id: stmt.id };
  } catch {
    return { error: "A statement already exists for this period" };
  }
}

// ── Statement lines ───────────────────────────────────────────────────────────

export async function getStatement(statementId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const stmt = await prisma.bankStatement.findFirst({
    where: { id: statementId, tenantId: owner.id },
    include: {
      bankAccount: { select: { id: true, name: true, accountNumber: true, currency: true, ledgerAccountId: true } },
      period: { select: { id: true, name: true, startDate: true, endDate: true, status: true } },
      lines: {
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        include: {
          matchedLine: {
            include: {
              journalEntry: { select: { date: true, description: true, reference: true } },
            },
          },
        },
      },
    },
  });
  if (!stmt) return null;

  return {
    id: stmt.id,
    bankAccount: stmt.bankAccount,
    period: {
      id: stmt.period.id,
      name: stmt.period.name,
      startDate: stmt.period.startDate.toISOString(),
      endDate: stmt.period.endDate.toISOString(),
      status: stmt.period.status,
    },
    openingBalance: toNum(stmt.openingBalance),
    closingBalance: toNum(stmt.closingBalance),
    status: stmt.status,
    reconciledAt: stmt.reconciledAt?.toISOString() ?? null,
    confirmedAt: stmt.confirmedAt?.toISOString() ?? null,
    notes: stmt.notes,
    lines: stmt.lines.map((l) => ({
      id: l.id,
      date: l.date.toISOString(),
      description: l.description,
      reference: l.reference,
      amount: toNum(l.amount),
      status: l.status,
      unmatchedReason: l.unmatchedReason,
      matchedJournalEntryLineId: l.matchedJournalEntryLineId,
      adjustingJournalEntryId: l.adjustingJournalEntryId,
      matchedLine: l.matchedLine
        ? {
            debit: toNum(l.matchedLine.debit),
            credit: toNum(l.matchedLine.credit),
            description: l.matchedLine.description,
            journalEntry: {
              date: l.matchedLine.journalEntry.date.toISOString(),
              description: l.matchedLine.journalEntry.description,
              reference: l.matchedLine.journalEntry.reference,
            },
          }
        : null,
    })),
  };
}

export async function addStatementLine(statementId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const stmt = await prisma.bankStatement.findFirst({ where: { id: statementId, tenantId: owner.id } });
  if (!stmt) return { error: "Statement not found" };
  if (stmt.status === "confirmed") return { error: "Statement is confirmed — cannot add lines" };

  const dateRaw = formData.get("date") as string;
  const description = (formData.get("description") as string)?.trim();
  const amountRaw = formData.get("amount") as string;

  if (!dateRaw || !description || !amountRaw) return { error: "Date, description and amount are required" };

  await prisma.bankStatementLine.create({
    data: {
      statementId,
      date: new Date(dateRaw),
      description,
      reference: (formData.get("reference") as string)?.trim() || null,
      amount: parseFloat(amountRaw),
      status: "unmatched",
    },
  });

  if (stmt.status === "draft") {
    await prisma.bankStatement.update({ where: { id: statementId }, data: { status: "in_progress" } });
  }

  revalidatePath(`/africs/accounting/bank-reconciliation/${stmt.bankAccountId}/${statementId}`);
  return { success: true };
}

export async function importStatementCSV(statementId: string, csvText: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found", count: 0 };

  const stmt = await prisma.bankStatement.findFirst({ where: { id: statementId, tenantId: owner.id } });
  if (!stmt) return { error: "Statement not found", count: 0 };
  if (stmt.status === "confirmed") return { error: "Statement is confirmed", count: 0 };

  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { error: "CSV must have a header row and at least one data row", count: 0 };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const dateIdx = header.findIndex((h) => h.includes("date"));
  const descIdx = header.findIndex((h) => h.includes("desc") || h.includes("narr") || h.includes("detail") || h.includes("memo"));
  const amtIdx  = header.findIndex((h) => h === "amount" || h === "amt");
  const refIdx  = header.findIndex((h) => h.includes("ref") || h.includes("cheque") || h.includes("check"));
  const debitIdx = header.findIndex((h) => h.includes("debit") || h.includes("withdrawal") || h.includes("dr"));
  const creditIdx = header.findIndex((h) => h.includes("credit") || h.includes("deposit") || h.includes("cr"));

  if (dateIdx === -1) return { error: "Could not find a Date column in CSV", count: 0 };
  if (descIdx === -1) return { error: "Could not find a Description column in CSV", count: 0 };
  if (amtIdx === -1 && (debitIdx === -1 || creditIdx === -1)) {
    return { error: "Could not find Amount (or Debit/Credit) columns in CSV", count: 0 };
  }

  const parsed: Array<{ date: Date; description: string; reference?: string; amount: number }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    if (cols.length < 2) continue;

    const dateStr = cols[dateIdx] ?? "";
    let date: Date;
    // Try YYYY-MM-DD first, then DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      date = new Date(dateStr);
    } else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const [d, m, y] = dateStr.split("/");
      date = new Date(`${y}-${m}-${d}`);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) continue;

    const description = (cols[descIdx] ?? "").trim();
    if (!description) continue;

    let amount: number;
    if (amtIdx !== -1) {
      amount = parseFloat((cols[amtIdx] ?? "0").replace(/[, ]/g, "")) || 0;
    } else {
      const debit  = parseFloat((cols[debitIdx]  ?? "0").replace(/[, ]/g, "")) || 0;
      const credit = parseFloat((cols[creditIdx] ?? "0").replace(/[, ]/g, "")) || 0;
      amount = credit - debit; // deposits positive, withdrawals negative
    }

    parsed.push({
      date,
      description,
      reference: refIdx !== -1 ? (cols[refIdx] ?? "").trim() || undefined : undefined,
      amount,
    });
  }

  if (parsed.length === 0) return { error: "No valid rows found in CSV", count: 0 };

  await prisma.bankStatementLine.createMany({
    data: parsed.map((p) => ({
      statementId,
      date: p.date,
      description: p.description,
      reference: p.reference ?? null,
      amount: p.amount,
      status: "unmatched",
    })),
  });

  if (stmt.status === "draft") {
    await prisma.bankStatement.update({ where: { id: statementId }, data: { status: "in_progress" } });
  }

  revalidatePath(`/africs/accounting/bank-reconciliation/${stmt.bankAccountId}/${statementId}`);
  return { success: true, count: parsed.length };
}

export async function deleteStatementLine(id: string) {
  const line = await prisma.bankStatementLine.findUnique({
    where: { id },
    include: { statement: true },
  });
  if (!line) return { error: "Not found" };
  if (line.statement.status === "confirmed") return { error: "Statement is confirmed" };

  await prisma.bankStatementLine.delete({ where: { id } });
  revalidatePath(`/africs/accounting/bank-reconciliation/${line.statement.bankAccountId}/${line.statementId}`);
  return { success: true };
}

export async function updateLineReason(id: string, unmatchedReason: string | null) {
  const line = await prisma.bankStatementLine.findUnique({
    where: { id },
    include: { statement: { select: { bankAccountId: true, status: true } } },
  });
  if (!line) return { error: "Not found" };
  if (line.statement.status === "confirmed") return { error: "Statement is confirmed" };

  await prisma.bankStatementLine.update({ where: { id }, data: { unmatchedReason } });
  revalidatePath(`/africs/accounting/bank-reconciliation/${line.statement.bankAccountId}/${line.statementId}`);
  return { success: true };
}

// ── Auto-matching ─────────────────────────────────────────────────────────────

export async function autoMatchStatement(statementId: string): Promise<{ matched: number; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { matched: 0, error: "No business found" };

  const stmt = await prisma.bankStatement.findFirst({
    where: { id: statementId, tenantId: owner.id },
    include: {
      bankAccount: { select: { ledgerAccountId: true } },
      period: { select: { startDate: true, endDate: true } },
    },
  });
  if (!stmt) return { matched: 0, error: "Statement not found" };
  if (!stmt.bankAccount.ledgerAccountId) return { matched: 0, error: "Bank account has no linked GL account" };

  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  // Load unmatched bank lines
  const bankLines = await prisma.bankStatementLine.findMany({
    where: { statementId, status: "unmatched" },
  });

  // Load all cash-account GL entry lines in the period range
  const allGlLines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: stmt.bankAccount.ledgerAccountId,
      journalEntry: {
        date: { gte: stmt.period.startDate, lte: stmt.period.endDate },
      },
    },
    include: { journalEntry: { select: { date: true } } },
  });

  // Exclude lines already matched to any bank statement line
  const alreadyMatchedIds = new Set(
    (await prisma.bankStatementLine.findMany({
      where: { matchedJournalEntryLineId: { not: null } },
      select: { matchedJournalEntryLineId: true },
    })).map((l) => l.matchedJournalEntryLineId!)
  );
  const glLines = allGlLines.filter((l) => !alreadyMatchedIds.has(l.id));

  let matched = 0;
  const usedGlLineIds = new Set<string>();

  for (const bl of bankLines) {
    const absAmount = Math.abs(toNum(bl.amount));
    const isDeposit = toNum(bl.amount) > 0;

    for (const gl of glLines) {
      if (usedGlLineIds.has(gl.id)) continue;
      const glAmount = isDeposit ? toNum(gl.debit) : toNum(gl.credit);
      if (Math.abs(glAmount - absAmount) > 0.005) continue;
      const daysDiff = Math.abs(new Date(bl.date).getTime() - new Date(gl.journalEntry.date).getTime());
      if (daysDiff > THREE_DAYS) continue;

      // Match found
      await prisma.bankStatementLine.update({
        where: { id: bl.id },
        data: { status: "matched", matchedJournalEntryLineId: gl.id },
      });
      usedGlLineIds.add(gl.id);
      matched++;
      break;
    }
  }

  if (matched > 0) {
    await prisma.bankStatement.update({ where: { id: statementId }, data: { status: "in_progress" } });
  }

  revalidatePath(`/africs/accounting/bank-reconciliation/${stmt.bankAccountId}/${statementId}`);
  return { matched };
}

export async function unmatchLine(id: string) {
  const line = await prisma.bankStatementLine.findUnique({
    where: { id },
    include: { statement: { select: { bankAccountId: true, status: true } } },
  });
  if (!line) return { error: "Not found" };
  if (line.statement.status === "confirmed") return { error: "Statement is confirmed" };

  await prisma.bankStatementLine.update({
    where: { id },
    data: { status: "unmatched", matchedJournalEntryLineId: null },
  });
  revalidatePath(`/africs/accounting/bank-reconciliation/${line.statement.bankAccountId}/${line.statementId}`);
  return { success: true };
}

// ── Adjusting entries ─────────────────────────────────────────────────────────

export async function postAdjustingEntry(lineId: string, type: "bank_fee" | "interest" | "nsf") {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const line = await prisma.bankStatementLine.findUnique({
    where: { id: lineId },
    include: {
      statement: {
        include: {
          bankAccount: { select: { currency: true, ledgerAccountId: true } },
          period: { select: { startDate: true, endDate: true, status: true } },
        },
      },
    },
  });
  if (!line) return { error: "Line not found" };
  if (line.status === "adjusting_entry_posted") return { error: "Adjusting entry already posted" };
  if (line.statement.status === "confirmed") return { error: "Statement is confirmed" };

  const amount = Math.abs(toNum(line.amount));
  const date = line.date;

  try {
    const je = await (async () => {
      if (type === "bank_fee") {
        return postJournalEntry({
          tenantId: owner.id,
          date,
          description: `Bank charge — ${line.description}`,
          sourceType: "bank_reconciliation",
          sourceId: line.id,
          lines: [
            { accountCode: "6900", debit: amount, description: "Bank fee / charge" },
            { accountCode: "1000", credit: amount, description: "Cash / Bank" },
          ],
        });
      } else if (type === "interest") {
        return postJournalEntry({
          tenantId: owner.id,
          date,
          description: `Bank interest earned — ${line.description}`,
          sourceType: "bank_reconciliation",
          sourceId: line.id,
          lines: [
            { accountCode: "1000", debit: amount, description: "Cash / Bank" },
            { accountCode: "4200", credit: amount, description: "Interest income" },
          ],
        });
      } else {
        // NSF: reverse original entry (simplification: post as bank fee)
        return postJournalEntry({
          tenantId: owner.id,
          date,
          description: `NSF / returned cheque — ${line.description}`,
          sourceType: "bank_reconciliation",
          sourceId: line.id,
          lines: [
            { accountCode: "6900", debit: amount, description: "NSF / returned cheque fee" },
            { accountCode: "1000", credit: amount, description: "Cash / Bank" },
          ],
        });
      }
    })();

    await prisma.bankStatementLine.update({
      where: { id: lineId },
      data: {
        status: "adjusting_entry_posted",
        unmatchedReason: type,
        adjustingJournalEntryId: je.id,
      },
    });

    revalidatePath(`/africs/accounting/bank-reconciliation/${line.statement.bankAccountId}/${line.statementId}`);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Summary & reconciliation ──────────────────────────────────────────────────

export async function getReconciliationSummary(statementId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const stmt = await prisma.bankStatement.findFirst({
    where: { id: statementId, tenantId: owner.id },
    include: {
      bankAccount: { select: { ledgerAccountId: true, currency: true } },
      period: { select: { endDate: true } },
      lines: true,
    },
  });
  if (!stmt) return null;

  const bankClosing = toNum(stmt.closingBalance);

  // Outstanding items affect adjusted bank balance
  const unmatchedLines = stmt.lines.filter((l) => l.status === "unmatched");
  const depositsInTransit = unmatchedLines
    .filter((l) => toNum(l.amount) > 0 && l.unmatchedReason === "deposit_in_transit")
    .reduce((s, l) => s + toNum(l.amount), 0);
  const outstandingCheques = unmatchedLines
    .filter((l) => toNum(l.amount) < 0 && l.unmatchedReason === "outstanding_cheque")
    .reduce((s, l) => s + Math.abs(toNum(l.amount)), 0);

  const adjustedBankBalance = bankClosing + depositsInTransit - outstandingCheques;

  // Book balance from GL
  let bookBalance = 0;
  if (stmt.bankAccount.ledgerAccountId) {
    const agg = await prisma.journalEntryLine.aggregate({
      where: {
        accountId: stmt.bankAccount.ledgerAccountId,
        journalEntry: { date: { lte: stmt.period.endDate } },
      },
      _sum: { debit: true, credit: true },
    });
    bookBalance = toNum(agg._sum.debit) - toNum(agg._sum.credit);
  }

  const difference = adjustedBankBalance - bookBalance;
  const isReconciled = Math.abs(difference) < 0.01;

  const matchedCount = stmt.lines.filter((l) => l.status === "matched" || l.status === "adjusting_entry_posted").length;
  const unmatchedCount = stmt.lines.filter((l) => l.status === "unmatched").length;

  return {
    bankClosing,
    depositsInTransit,
    outstandingCheques,
    adjustedBankBalance,
    bookBalance,
    difference,
    isReconciled,
    matchedCount,
    unmatchedCount,
    totalLines: stmt.lines.length,
    currency: stmt.bankAccount.currency,
  };
}

export async function confirmReconciliation(statementId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };
  const session = await auth();

  const summary = await getReconciliationSummary(statementId);
  if (!summary) return { error: "Statement not found" };
  if (!summary.isReconciled) return { error: "Adjusted bank balance does not match book balance" };

  const stmt = await prisma.bankStatement.findFirst({ where: { id: statementId, tenantId: owner.id } });
  if (!stmt) return { error: "Not found" };

  await prisma.bankStatement.update({
    where: { id: statementId },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      confirmedById: session?.user?.id ?? null,
      reconciledAt: new Date(),
      reconciledById: session?.user?.id ?? null,
    },
  });

  revalidatePath(`/africs/accounting/bank-reconciliation/${stmt.bankAccountId}/${statementId}`);
  revalidatePath(`/africs/accounting/bank-reconciliation/${stmt.bankAccountId}`);
  return { success: true };
}

export async function reopenReconciliation(statementId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const stmt = await prisma.bankStatement.findFirst({ where: { id: statementId, tenantId: owner.id } });
  if (!stmt) return { error: "Not found" };

  await prisma.bankStatement.update({
    where: { id: statementId },
    data: {
      status: "in_progress",
      confirmedAt: null,
      confirmedById: null,
      notes: stmt.notes
        ? `${stmt.notes}\nReopened on ${new Date().toISOString()}`
        : `Reopened on ${new Date().toISOString()}`,
    },
  });

  revalidatePath(`/africs/accounting/bank-reconciliation/${stmt.bankAccountId}/${statementId}`);
  return { success: true };
}
