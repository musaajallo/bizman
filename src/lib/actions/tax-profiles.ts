"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

export async function getTaxProfiles(tenantId?: string) {
  const id = tenantId ?? (await getOwnerBusiness())?.id;
  if (!id) return [];

  const profiles = await prisma.taxProfile.findMany({
    where: { tenantId: id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return profiles.map((p) => ({ ...p, rate: Number(p.rate) }));
}

export async function createTaxProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const name = (formData.get("name") as string)?.trim();
  const rate = parseFloat(formData.get("rate") as string);
  const description = (formData.get("description") as string)?.trim() || null;
  const isDefault = formData.get("isDefault") === "true";

  if (!name) return { error: "Name is required" };
  if (isNaN(rate) || rate < 0 || rate > 100) return { error: "Rate must be between 0 and 100" };

  if (isDefault) {
    await prisma.taxProfile.updateMany({
      where: { tenantId: owner.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.taxProfile.create({
    data: { tenantId: owner.id, name, rate, description, isDefault },
  });

  revalidatePath("/africs/settings/invoices/tax");
  return { success: true };
}

export async function updateTaxProfile(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const name = (formData.get("name") as string)?.trim();
  const rate = parseFloat(formData.get("rate") as string);
  const description = (formData.get("description") as string)?.trim() || null;
  const isDefault = formData.get("isDefault") === "true";

  if (!name) return { error: "Name is required" };
  if (isNaN(rate) || rate < 0 || rate > 100) return { error: "Rate must be between 0 and 100" };

  if (isDefault) {
    await prisma.taxProfile.updateMany({
      where: { tenantId: owner.id, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }

  await prisma.taxProfile.update({
    where: { id, tenantId: owner.id },
    data: { name, rate, description, isDefault },
  });

  revalidatePath("/africs/settings/invoices/tax");
  return { success: true };
}

export async function deleteTaxProfile(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.taxProfile.delete({ where: { id, tenantId: owner.id } });

  revalidatePath("/africs/settings/invoices/tax");
  return { success: true };
}
