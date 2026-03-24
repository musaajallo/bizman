"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

export async function getVendors(filters?: { status?: string; search?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { contactName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { bills: true } } },
  });

  return vendors.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));
}

export async function getVendor(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const vendor = await prisma.vendor.findFirst({
    where: { id, tenantId: owner.id },
    include: { _count: { select: { bills: true } } },
  });
  if (!vendor) return null;

  const stats = await prisma.bill.aggregate({
    where: { vendorId: id, tenantId: owner.id, status: { notIn: ["void"] } },
    _sum: { totalAmount: true, amountPaid: true, amountDue: true },
  });

  return {
    ...vendor,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
    totalBilled: Number(stats._sum.totalAmount ?? 0),
    totalPaid: Number(stats._sum.amountPaid ?? 0),
    totalOutstanding: Number(stats._sum.amountDue ?? 0),
  };
}

export async function createVendor(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Vendor name is required" };

  const vendor = await prisma.vendor.create({
    data: {
      tenantId: owner.id,
      name,
      contactName: (formData.get("contactName") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      website: (formData.get("website") as string) || null,
      paymentTerms: (formData.get("paymentTerms") as string) || "net30",
      bankName: (formData.get("bankName") as string) || null,
      bankAccountName: (formData.get("bankAccountName") as string) || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string) || null,
      bankBranch: (formData.get("bankBranch") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/accounting/vendors");
  return { id: vendor.id };
}

export async function updateVendor(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const vendor = await prisma.vendor.findFirst({ where: { id, tenantId: owner.id } });
  if (!vendor) return { error: "Not found" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Vendor name is required" };

  await prisma.vendor.update({
    where: { id },
    data: {
      name,
      contactName: (formData.get("contactName") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      website: (formData.get("website") as string) || null,
      paymentTerms: (formData.get("paymentTerms") as string) || "net30",
      bankName: (formData.get("bankName") as string) || null,
      bankAccountName: (formData.get("bankAccountName") as string) || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string) || null,
      bankBranch: (formData.get("bankBranch") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/accounting/vendors");
  revalidatePath(`/africs/accounting/vendors/${id}`);
  return { success: true };
}

export async function deactivateVendor(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const vendor = await prisma.vendor.findFirst({ where: { id, tenantId: owner.id } });
  if (!vendor) return { error: "Not found" };

  const outstanding = await prisma.bill.count({
    where: { vendorId: id, tenantId: owner.id, status: { in: ["approved", "partially_paid", "overdue"] } },
  });
  if (outstanding > 0) return { error: "Cannot deactivate a vendor with outstanding bills" };

  await prisma.vendor.update({ where: { id }, data: { status: "inactive" } });
  revalidatePath("/africs/accounting/vendors");
  revalidatePath(`/africs/accounting/vendors/${id}`);
  return { success: true };
}

export async function reactivateVendor(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.vendor.updateMany({ where: { id, tenantId: owner.id }, data: { status: "active" } });
  revalidatePath("/africs/accounting/vendors");
  revalidatePath(`/africs/accounting/vendors/${id}`);
  return { success: true };
}
