"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "@/lib/actions/tenants";

// ── Default Chart of Accounts ────────────────────────────────────────────────

export const DEFAULT_ACCOUNTS = [
  // Assets
  { code: "1000", name: "Cash",                              type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1010", name: "Petty Cash",                        type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1100", name: "Accounts Receivable",               type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1110", name: "Allowance for Doubtful Accounts",   type: "Asset",        normalBalance: "credit", isContra: true  },
  { code: "1200", name: "Inventory",                         type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1300", name: "Prepaid Expenses",                  type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1400", name: "Short-term Investments",            type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1500", name: "Property, Plant & Equipment",       type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1510", name: "Accumulated Depreciation",          type: "Asset",        normalBalance: "credit", isContra: true  },
  { code: "1600", name: "Intangible Assets",                 type: "Asset",        normalBalance: "debit",  isContra: false },
  { code: "1610", name: "Accumulated Amortisation",          type: "Asset",        normalBalance: "credit", isContra: true  },
  { code: "1700", name: "Loans Receivable",                  type: "Asset",        normalBalance: "debit",  isContra: false },
  // Liabilities
  { code: "2000", name: "Accounts Payable",                  type: "Liability",    normalBalance: "credit", isContra: false },
  { code: "2100", name: "Wages Payable",                     type: "Liability",    normalBalance: "credit", isContra: false },
  { code: "2200", name: "PAYE / Tax Payable",                type: "Liability",    normalBalance: "credit", isContra: false },
  { code: "2300", name: "Unearned Revenue",                  type: "Liability",    normalBalance: "credit", isContra: false },
  { code: "2400", name: "Short-term Loans Payable",          type: "Liability",    normalBalance: "credit", isContra: false },
  { code: "2500", name: "Credit Card Payable",               type: "Liability",    normalBalance: "credit", isContra: false },
  { code: "2600", name: "Long-term Loans Payable",           type: "Liability",    normalBalance: "credit", isContra: false },
  // Equity
  { code: "3000", name: "Owner's Capital / Share Capital",   type: "Equity",       normalBalance: "credit", isContra: false },
  { code: "3100", name: "Retained Earnings",                 type: "Equity",       normalBalance: "credit", isContra: false },
  { code: "3200", name: "Drawings / Dividends Paid",         type: "Equity",       normalBalance: "debit",  isContra: false },
  // Revenue
  { code: "4000", name: "Service Revenue",                   type: "Revenue",      normalBalance: "credit", isContra: false },
  { code: "4100", name: "Product / Sales Revenue",           type: "Revenue",      normalBalance: "credit", isContra: false },
  { code: "4200", name: "Interest Income",                   type: "Revenue",      normalBalance: "credit", isContra: false },
  { code: "4300", name: "Rental Income",                     type: "Revenue",      normalBalance: "credit", isContra: false },
  { code: "4400", name: "Gain on Asset Disposal",            type: "NonOperating", normalBalance: "credit", isContra: false },
  { code: "4500", name: "Purchase Discounts Received",       type: "Revenue",      normalBalance: "credit", isContra: false },
  // Cost of Sales
  { code: "5000", name: "Cost of Goods Sold",                type: "CostOfSales",  normalBalance: "debit",  isContra: false },
  { code: "5100", name: "Direct Labour",                     type: "CostOfSales",  normalBalance: "debit",  isContra: false },
  // Operating Expenses
  { code: "6000", name: "Salaries & Wages Expense",          type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6100", name: "Rent Expense",                      type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6200", name: "Utilities Expense",                 type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6300", name: "Marketing & Advertising",           type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6400", name: "Travel & Entertainment",            type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6500", name: "Depreciation Expense",              type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6600", name: "Bad Debts Expense",                 type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6700", name: "Insurance Expense",                 type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6800", name: "Professional Fees",                 type: "Expense",      normalBalance: "debit",  isContra: false },
  { code: "6900", name: "General & Administrative",          type: "Expense",      normalBalance: "debit",  isContra: false },
  // Non-Operating
  { code: "7000", name: "Interest Expense",                  type: "NonOperating", normalBalance: "debit",  isContra: false },
  { code: "7100", name: "Loss on Asset Disposal",            type: "NonOperating", normalBalance: "debit",  isContra: false },
  { code: "7200", name: "Foreign Exchange Loss",             type: "NonOperating", normalBalance: "debit",  isContra: false },
  { code: "7300", name: "Income Tax Expense",                type: "NonOperating", normalBalance: "debit",  isContra: false },
] as const;

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
