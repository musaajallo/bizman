"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { postJournalEntry } from "./journal";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgingBucket {
  bucketLabel:    string;
  minDays:        number;
  maxDays:        number | null; // null = unlimited (90d+)
  reservePercent: number;
}

const DEFAULT_AGING_BUCKETS: AgingBucket[] = [
  { bucketLabel: "Current (0–30 days)",  minDays: 0,  maxDays: 30,  reservePercent: 1  },
  { bucketLabel: "31–60 days",           minDays: 31, maxDays: 60,  reservePercent: 5  },
  { bucketLabel: "61–90 days",           minDays: 61, maxDays: 90,  reservePercent: 15 },
  { bucketLabel: "Over 90 days",         minDays: 91, maxDays: null, reservePercent: 50 },
];

// ── Bad Debt Config ───────────────────────────────────────────────────────────

export async function getBadDebtConfig(): Promise<AgingBucket[]> {
  const owner = await getOwnerBusiness();
  if (!owner) return DEFAULT_AGING_BUCKETS;

  const config = await prisma.badDebtConfig.findUnique({ where: { tenantId: owner.id } });
  if (!config) return DEFAULT_AGING_BUCKETS;

  return config.agingBuckets as unknown as AgingBucket[];
}

export async function saveBadDebtConfig(buckets: AgingBucket[]): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.badDebtConfig.upsert({
    where:  { tenantId: owner.id },
    create: { tenantId: owner.id, agingBuckets: buckets as object[] },
    update: { agingBuckets: buckets as object[] },
  });

  revalidatePath("/africs/accounting/bad-debts");
  return { success: true };
}

// ── AR Aging with NRV ─────────────────────────────────────────────────────────

export async function getARAgingWithNRV(asOf?: Date) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const asOfDate = asOf ?? new Date();
  const buckets  = await getBadDebtConfig();

  // Fetch all outstanding invoices (sent | viewed | overdue)
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: owner.id,
      type:     "standard",
      status:   { in: ["sent", "viewed", "overdue"] },
    },
    select: {
      id:          true,
      invoiceNumber:true,
      clientName:  true,
      dueDate:     true,
      total:       true,
      payments: {
        select: { amount: true },
      },
    },
  });

  // Compute outstanding balance per invoice
  const rows = invoices.map((inv) => {
    const paid       = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Number(inv.total) - paid;
    const ageDays    = Math.floor((asOfDate.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
    const ageDisplay = ageDays < 0 ? 0 : ageDays;

    const bucket = buckets.find(
      (b) => ageDisplay >= b.minDays && (b.maxDays === null || ageDisplay <= b.maxDays)
    ) ?? buckets[buckets.length - 1];

    const allowanceAmount = outstanding * (bucket.reservePercent / 100);

    return {
      id:              inv.id,
      invoiceNumber:   inv.invoiceNumber,
      clientName:      inv.clientName,
      dueDate:         inv.dueDate.toISOString(),
      outstanding,
      ageDays:         ageDisplay,
      bucketLabel:     bucket.bucketLabel,
      reservePercent:  bucket.reservePercent,
      allowanceAmount,
      netRealisable:   outstanding - allowanceAmount,
    };
  }).filter((r) => r.outstanding > 0.01);

  // Aggregate by bucket
  const bucketSummary = buckets.map((b) => {
    const bucketRows = rows.filter((r) => r.bucketLabel === b.bucketLabel);
    const grossAR    = bucketRows.reduce((s, r) => s + r.outstanding, 0);
    const allowance  = bucketRows.reduce((s, r) => s + r.allowanceAmount, 0);
    return {
      bucketLabel:    b.bucketLabel,
      reservePercent: b.reservePercent,
      grossAR,
      allowance,
      netRealisable:  grossAR - allowance,
      count:          bucketRows.length,
    };
  });

  const totalGrossAR    = rows.reduce((s, r) => s + r.outstanding, 0);
  const totalAllowance  = rows.reduce((s, r) => s + r.allowanceAmount, 0);
  const totalNRV        = totalGrossAR - totalAllowance;

  return { rows, bucketSummary, totalGrossAR, totalAllowance, totalNRV, asOf: asOfDate };
}

// ── Current GL Allowance Balance ──────────────────────────────────────────────

export async function getCurrentAllowanceBalance(): Promise<number> {
  const owner = await getOwnerBusiness();
  if (!owner) return 0;

  const acc = await prisma.ledgerAccount.findFirst({
    where: { tenantId: owner.id, code: "1110", isActive: true },
  });
  if (!acc) return 0;

  const agg = await prisma.journalEntryLine.aggregate({
    where:  { accountId: acc.id },
    _sum:   { debit: true, credit: true },
  });

  const dr = Number(agg._sum.debit  ?? 0);
  const cr = Number(agg._sum.credit ?? 0);
  // 1110 is credit-normal (contra-asset), so balance = cr - dr
  return cr - dr;
}

// ── Post Allowance Adjustment ─────────────────────────────────────────────────

export async function postAllowanceAdjustment(input: {
  requiredAllowance: number;
  description?: string;
}): Promise<{ success?: boolean; error?: string; adjustment?: number }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const currentBalance = await getCurrentAllowanceBalance();
  const adjustment     = input.requiredAllowance - currentBalance;

  if (Math.abs(adjustment) < 0.01) {
    return { success: true, adjustment: 0 };
  }

  const description = input.description?.trim() ||
    `Allowance for Doubtful Accounts adjustment — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;

  try {
    if (adjustment > 0) {
      // Increase allowance: DR 6600 Bad Debts / CR 1110 Allowance
      await postJournalEntry({
        tenantId:   owner.id,
        date:       new Date(),
        description,
        sourceType: "adjusting",
        lines: [
          { accountCode: "6600", debit:  adjustment },
          { accountCode: "1110", credit: adjustment },
        ],
      });
    } else {
      // Over-provisioned — reverse: DR 1110 / CR 6600
      const reversal = Math.abs(adjustment);
      await postJournalEntry({
        tenantId:   owner.id,
        date:       new Date(),
        description: `REVERSAL: ${description}`,
        sourceType: "adjusting",
        lines: [
          { accountCode: "1110", debit:  reversal },
          { accountCode: "6600", credit: reversal },
        ],
      });
    }

    revalidatePath("/africs/accounting/bad-debts");
    revalidatePath("/africs/accounting/journal-entries");
    return { success: true, adjustment };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Write-off Receivable ──────────────────────────────────────────────────────

export async function writeOffReceivable(input: {
  invoiceId: string;
  amount: number;
  description?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId, tenantId: owner.id },
    select: { invoiceNumber: true, clientName: true, status: true },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (!["sent", "viewed", "overdue"].includes(invoice.status)) {
    return { error: "Invoice must be outstanding (sent / viewed / overdue) to write off" };
  }

  if (input.amount <= 0) return { error: "Write-off amount must be greater than zero" };

  const description = input.description?.trim() ||
    `Write-off: ${invoice.invoiceNumber} — ${invoice.clientName}`;

  try {
    // DR 1110 Allowance for DA / CR 1100 Accounts Receivable
    await postJournalEntry({
      tenantId:    owner.id,
      date:        new Date(),
      description,
      sourceType:  "adjusting",
      sourceId:    input.invoiceId,
      lines: [
        { accountCode: "1110", debit:  input.amount },
        { accountCode: "1100", credit: input.amount },
      ],
    });

    revalidatePath("/africs/accounting/bad-debts");
    revalidatePath("/africs/accounting/journal-entries");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Recovery ─────────────────────────────────────────────────────────────────

export async function recoverWrittenOff(input: {
  invoiceId: string;
  amount: number;
  description?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId, tenantId: owner.id },
    select: { invoiceNumber: true, clientName: true },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (input.amount <= 0) return { error: "Recovery amount must be greater than zero" };

  const baseDesc = input.description?.trim() ||
    `Recovery: ${invoice.invoiceNumber} — ${invoice.clientName}`;

  try {
    await prisma.$transaction(async (tx) => {
      // Entry 1: Reverse the write-off — DR 1100 AR / CR 1110 Allowance
      await postJournalEntry({
        tenantId:    owner.id,
        date:        new Date(),
        description: `${baseDesc} (reverse write-off)`,
        sourceType:  "adjusting",
        sourceId:    input.invoiceId,
        lines: [
          { accountCode: "1100", debit:  input.amount },
          { accountCode: "1110", credit: input.amount },
        ],
        tx,
      });

      // Entry 2: Record cash receipt — DR 1000 Cash / CR 1100 AR
      await postJournalEntry({
        tenantId:    owner.id,
        date:        new Date(),
        description: `${baseDesc} (cash received)`,
        sourceType:  "adjusting",
        sourceId:    input.invoiceId,
        lines: [
          { accountCode: "1000", debit:  input.amount },
          { accountCode: "1100", credit: input.amount },
        ],
        tx,
      });
    });

    revalidatePath("/africs/accounting/bad-debts");
    revalidatePath("/africs/accounting/journal-entries");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
