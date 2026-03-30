"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { DEFAULT_ACCOUNTS } from "@/lib/accounting-constants";

// ── Initialize accounting for a tenant ───────────────────────────────────────

export async function initializeAccounting() {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const existing = await prisma.ledgerAccount.count({ where: { tenantId: owner.id } });
  if (existing > 0) return { alreadyInitialized: true };

  await prisma.ledgerAccount.createMany({
    data: DEFAULT_ACCOUNTS.map((a) => ({
      tenantId:      owner.id,
      code:          a.code,
      name:          a.name,
      type:          a.type,
      normalBalance: a.normalBalance,
      isContra:      a.isContra,
      isSystem:      true,
    })),
  });

  // Create the first accounting period (current calendar month)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await prisma.accountingPeriod.create({
    data: {
      tenantId:   owner.id,
      name:       startDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      startDate,
      endDate,
      fiscalYear: now.getFullYear(),
      status:     "open",
    },
  });

  revalidatePath("/africs/accounting/chart-of-accounts");
  return { success: true };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getLedgerAccounts() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  return prisma.ledgerAccount.findMany({
    where: { tenantId: owner.id },
    orderBy: { code: "asc" },
    include: { _count: { select: { journalEntryLines: true } } },
  });
}

export async function getLedgerAccountByCode(code: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;
  return prisma.ledgerAccount.findUnique({ where: { tenantId_code: { tenantId: owner.id, code } } });
}

export async function isAccountingInitialized() {
  const owner = await getOwnerBusiness();
  if (!owner) return false;
  const count = await prisma.ledgerAccount.count({ where: { tenantId: owner.id } });
  return count > 0;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createLedgerAccount(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const code = (formData.get("code") as string).trim();
  const existing = await prisma.ledgerAccount.findUnique({
    where: { tenantId_code: { tenantId: owner.id, code } },
  });
  if (existing) return { error: `Account code ${code} already exists` };

  const account = await prisma.ledgerAccount.create({
    data: {
      tenantId:      owner.id,
      code,
      name:          formData.get("name") as string,
      type:          formData.get("type") as string,
      normalBalance: formData.get("normalBalance") as string,
      isContra:      formData.get("isContra") === "true",
      parentId:      (formData.get("parentId") as string) || null,
      description:   (formData.get("description") as string) || null,
      isSystem:      false,
    },
  });

  revalidatePath("/africs/accounting/chart-of-accounts");
  return { id: account.id };
}

export async function updateLedgerAccount(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const account = await prisma.ledgerAccount.findUnique({ where: { id, tenantId: owner.id } });
  if (!account) return { error: "Not found" };

  await prisma.ledgerAccount.update({
    where: { id },
    data: {
      name:        formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      parentId:    (formData.get("parentId") as string) || null,
      // type and normalBalance cannot change after creation
    },
  });

  revalidatePath("/africs/accounting/chart-of-accounts");
  return { success: true };
}

export async function toggleLedgerAccountActive(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const account = await prisma.ledgerAccount.findUnique({ where: { id, tenantId: owner.id } });
  if (!account) return { error: "Not found" };

  const hasEntries = await prisma.journalEntryLine.count({ where: { accountId: id } });
  if (hasEntries > 0 && account.isActive) {
    return { error: "Cannot deactivate an account with posted journal entries" };
  }

  await prisma.ledgerAccount.update({ where: { id }, data: { isActive: !account.isActive } });
  revalidatePath("/africs/accounting/chart-of-accounts");
  return { success: true };
}
