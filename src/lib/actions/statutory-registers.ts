"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

// ─── Directors ───────────────────────────────────────────────

export async function getDirectors(tenantId: string) {
  return prisma.director.findMany({
    where: { tenantId },
    orderBy: [{ cessationDate: "asc" }, { appointmentDate: "desc" }],
  });
}

export async function createDirector(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No owner business" };

  await prisma.director.create({
    data: {
      tenantId: owner.id,
      fullName: formData.get("fullName") as string,
      title: (formData.get("title") as string) || null,
      designation: (formData.get("designation") as string) || "Director",
      nationality: (formData.get("nationality") as string) || null,
      idNumber: (formData.get("idNumber") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      residentialAddress: (formData.get("residentialAddress") as string) || null,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : null,
      appointmentDate: new Date(formData.get("appointmentDate") as string),
      shareholding: formData.get("shareholding") ? parseFloat(formData.get("shareholding") as string) : null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/company/statutory-registers");
  return { success: true };
}

export async function updateDirector(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.director.update({
    where: { id },
    data: {
      fullName: formData.get("fullName") as string,
      title: (formData.get("title") as string) || null,
      designation: (formData.get("designation") as string) || "Director",
      nationality: (formData.get("nationality") as string) || null,
      idNumber: (formData.get("idNumber") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      residentialAddress: (formData.get("residentialAddress") as string) || null,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : null,
      appointmentDate: new Date(formData.get("appointmentDate") as string),
      cessationDate: formData.get("cessationDate") ? new Date(formData.get("cessationDate") as string) : null,
      cessationReason: (formData.get("cessationReason") as string) || null,
      shareholding: formData.get("shareholding") ? parseFloat(formData.get("shareholding") as string) : null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/company/statutory-registers");
  return { success: true };
}

export async function deleteDirector(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.director.delete({ where: { id } });
  revalidatePath("/africs/company/statutory-registers");
  return { success: true };
}

// ─── Shareholders ────────────────────────────────────────────

export async function getShareholders(tenantId: string) {
  return prisma.shareholder.findMany({
    where: { tenantId },
    orderBy: [{ dateCeased: "asc" }, { percentageHeld: "desc" }],
  });
}

export async function createShareholder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No owner business" };

  await prisma.shareholder.create({
    data: {
      tenantId: owner.id,
      name: formData.get("name") as string,
      type: (formData.get("type") as string) || "individual",
      nationality: (formData.get("nationality") as string) || null,
      idNumber: (formData.get("idNumber") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      sharesHeld: parseInt(formData.get("sharesHeld") as string),
      shareClass: (formData.get("shareClass") as string) || "Ordinary",
      nominalValue: formData.get("nominalValue") ? parseFloat(formData.get("nominalValue") as string) : null,
      percentageHeld: parseFloat(formData.get("percentageHeld") as string),
      dateAcquired: new Date(formData.get("dateAcquired") as string),
      transferDetails: (formData.get("transferDetails") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/company/statutory-registers");
  return { success: true };
}

export async function updateShareholder(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.shareholder.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      type: (formData.get("type") as string) || "individual",
      nationality: (formData.get("nationality") as string) || null,
      idNumber: (formData.get("idNumber") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      sharesHeld: parseInt(formData.get("sharesHeld") as string),
      shareClass: (formData.get("shareClass") as string) || "Ordinary",
      nominalValue: formData.get("nominalValue") ? parseFloat(formData.get("nominalValue") as string) : null,
      percentageHeld: parseFloat(formData.get("percentageHeld") as string),
      dateCeased: formData.get("dateCeased") ? new Date(formData.get("dateCeased") as string) : null,
      transferDetails: (formData.get("transferDetails") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/company/statutory-registers");
  return { success: true };
}

export async function deleteShareholder(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.shareholder.delete({ where: { id } });
  revalidatePath("/africs/company/statutory-registers");
  return { success: true };
}
