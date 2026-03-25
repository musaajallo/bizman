"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getInvoiceSettings(tenantId: string) {
  const settings = await prisma.invoiceSettings.upsert({
    where: { tenantId },
    update: {},
    create: { tenantId },
  });

  return {
    ...settings,
    defaultTaxRate: settings.defaultTaxRate ? Number(settings.defaultTaxRate) : null,
    defaultDiscountPercent: settings.defaultDiscountPercent ? Number(settings.defaultDiscountPercent) : null,
    defaultRushFeePercent: settings.defaultRushFeePercent ? Number(settings.defaultRushFeePercent) : null,
  };
}

// All known settings field names
const SETTINGS_FIELDS = [
  "prefix", "defaultDueDays",
  "defaultNotes", "defaultTerms",
  "bankName", "bankAccountName", "bankAccountNumber", "bankRoutingNumber", "bankSwift", "bankIban",
  "taxLabel", "defaultTaxRate",
  "proformaPrefix", "proformaNextNumber",
] as const;

export async function updateInvoiceSettings(tenantId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Only update fields that are present in the submitted form
  const data: Record<string, unknown> = {};

  if (formData.has("prefix")) {
    data.prefix = (formData.get("prefix") as string) || "INV";
  }
  if (formData.has("defaultDueDays")) {
    data.defaultDueDays = parseInt(formData.get("defaultDueDays") as string) || 30;
  }
  if (formData.has("taxLabel")) {
    data.taxLabel = (formData.get("taxLabel") as string) || "Tax";
  }
  if (formData.has("defaultTaxRate")) {
    const str = formData.get("defaultTaxRate") as string;
    data.defaultTaxRate = str ? parseFloat(str) : null;
  }
  if (formData.has("defaultDiscountPercent")) {
    const str = formData.get("defaultDiscountPercent") as string;
    data.defaultDiscountPercent = str ? parseFloat(str) : null;
  }
  if (formData.has("defaultRushFeePercent")) {
    const str = formData.get("defaultRushFeePercent") as string;
    data.defaultRushFeePercent = str ? parseFloat(str) : null;
  }
  if (formData.has("bankName")) {
    data.bankName = (formData.get("bankName") as string) || null;
  }
  if (formData.has("bankAccountName")) {
    data.bankAccountName = (formData.get("bankAccountName") as string) || null;
  }
  if (formData.has("bankAccountNumber")) {
    data.bankAccountNumber = (formData.get("bankAccountNumber") as string) || null;
  }
  if (formData.has("bankRoutingNumber")) {
    data.bankRoutingNumber = (formData.get("bankRoutingNumber") as string) || null;
  }
  if (formData.has("bankSwift")) {
    data.bankSwift = (formData.get("bankSwift") as string) || null;
  }
  if (formData.has("bankIban")) {
    data.bankIban = (formData.get("bankIban") as string) || null;
  }
  if (formData.has("defaultNotes")) {
    data.defaultNotes = (formData.get("defaultNotes") as string) || null;
  }
  if (formData.has("defaultTerms")) {
    data.defaultTerms = (formData.get("defaultTerms") as string) || null;
  }
  if (formData.has("proformaPrefix")) {
    data.proformaPrefix = (formData.get("proformaPrefix") as string) || "PRO";
  }
  if (formData.has("proformaNextNumber")) {
    data.proformaNextNumber = parseInt(formData.get("proformaNextNumber") as string) || 1;
  }
  if (formData.has("creditNotePrefix")) {
    data.creditNotePrefix = (formData.get("creditNotePrefix") as string) || "CN";
  }
  if (formData.has("creditNoteNextNumber")) {
    data.creditNoteNextNumber = parseInt(formData.get("creditNoteNextNumber") as string) || 1;
  }
  if (formData.has("accentColor")) {
    data.accentColor = (formData.get("accentColor") as string) || null;
  }
  if (formData.has("logoUrl")) {
    data.logoUrl = (formData.get("logoUrl") as string) || null;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No settings to update" };
  }

  await prisma.invoiceSettings.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}
