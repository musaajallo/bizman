"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

async function getTenantId(): Promise<string | null> {
  const owner = await getOwnerBusiness();
  return owner?.id ?? null;
}

// ─── Benefit Types ────────────────────────────────────────────────────────────

export async function getBenefitTypes() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.benefitType.findMany({
    where: { tenantId },
    include: { _count: { select: { benefits: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getBenefitType(id: string) {
  return prisma.benefitType.findUnique({
    where: { id },
    include: { _count: { select: { benefits: true } } },
  });
}

export async function createBenefitType(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const defaultValueStr = formData.get("defaultValue") as string;
  const defaultValue = defaultValueStr ? parseFloat(defaultValueStr) : null;

  await prisma.benefitType.create({
    data: {
      tenantId,
      name,
      category: (formData.get("category") as string) || "other",
      valueType: (formData.get("valueType") as string) || "fixed",
      defaultValue: defaultValue ?? undefined,
      currency: (formData.get("currency") as string) || "USD",
      description: (formData.get("description") as string)?.trim() || null,
      isActive: formData.get("isActive") !== "false",
    },
  });

  revalidatePath("/africs/hr/benefits");
  return { success: true };
}

export async function updateBenefitType(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const defaultValueStr = formData.get("defaultValue") as string;
  const defaultValue = defaultValueStr ? parseFloat(defaultValueStr) : null;

  await prisma.benefitType.update({
    where: { id },
    data: {
      name,
      category: (formData.get("category") as string) || "other",
      valueType: (formData.get("valueType") as string) || "fixed",
      defaultValue: defaultValue ?? undefined,
      currency: (formData.get("currency") as string) || "USD",
      description: (formData.get("description") as string)?.trim() || null,
      isActive: formData.get("isActive") !== "false",
    },
  });

  revalidatePath("/africs/hr/benefits");
  return { success: true };
}

export async function deleteBenefitType(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.benefitType.delete({ where: { id } });
  revalidatePath("/africs/hr/benefits");
  return { success: true };
}

// ─── Employee Benefits ────────────────────────────────────────────────────────

export async function getEmployeeBenefits(employeeId: string) {
  return prisma.employeeBenefit.findMany({
    where: { employeeId },
    include: {
      benefitType: true,
    },
    orderBy: { benefitType: { name: "asc" } },
  });
}

export async function getTenantBenefitSummary() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  return prisma.employeeBenefit.findMany({
    where: { tenantId, isActive: true },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
      benefitType: { select: { id: true, name: true, category: true, valueType: true, currency: true } },
    },
    orderBy: [{ benefitType: { category: "asc" } }, { employee: { lastName: "asc" } }],
  });
}

export async function assignBenefit(data: {
  employeeId: string;
  benefitTypeId: string;
  overrideValue?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  await prisma.employeeBenefit.upsert({
    where: { employeeId_benefitTypeId: { employeeId: data.employeeId, benefitTypeId: data.benefitTypeId } },
    update: {
      overrideValue: data.overrideValue ?? null,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      notes: data.notes?.trim() || null,
      isActive: true,
    },
    create: {
      tenantId,
      employeeId: data.employeeId,
      benefitTypeId: data.benefitTypeId,
      overrideValue: data.overrideValue ?? null,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/africs/hr/benefits");
  revalidatePath(`/africs/hr/employees`);
  return { success: true };
}

export async function removeEmployeeBenefit(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.employeeBenefit.delete({ where: { id } });
  revalidatePath("/africs/hr/benefits");
  return { success: true };
}
