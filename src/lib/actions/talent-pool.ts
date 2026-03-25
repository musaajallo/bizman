"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

export async function submitTalentPoolApplication(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required" };

  const skillsRaw = formData.get("skills") as string;
  const skills = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const existing = await prisma.talentPoolEntry.findUnique({
    where: { tenantId_email: { tenantId: owner.id, email } },
  });
  if (existing) return { error: "An application with this email already exists." };

  await prisma.talentPoolEntry.create({
    data: {
      tenantId: owner.id,
      name: (formData.get("name") as string).trim(),
      email,
      phone: (formData.get("phone") as string) || null,
      linkedInUrl: (formData.get("linkedInUrl") as string) || null,
      desiredRole: (formData.get("desiredRole") as string) || null,
      department: (formData.get("department") as string) || null,
      skills,
      experienceLevel: (formData.get("experienceLevel") as string) || null,
      resumeUrl: (formData.get("resumeUrl") as string) || null,
      notes: (formData.get("notes") as string) || null,
      source: "self_applied",
    },
  });

  return { success: true };
}

export async function getTalentPoolEntries(filters?: {
  status?: string;
  department?: string;
  experienceLevel?: string;
  search?: string;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.department) where.department = filters.department;
  if (filters?.experienceLevel) where.experienceLevel = filters.experienceLevel;

  const entries = await prisma.talentPoolEntry.findMany({
    where: filters?.search
      ? {
          ...where,
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { desiredRole: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : where,
    orderBy: { createdAt: "desc" },
  });

  return entries.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
}

export async function getTalentPoolEntryById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const entry = await prisma.talentPoolEntry.findUnique({
    where: { id, tenantId: owner.id },
    include: { applications: { include: { jobPosting: { select: { id: true, title: true, status: true } } } } },
  });
  if (!entry) return null;

  return {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    applications: entry.applications.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  };
}

export async function updateTalentPoolStatus(id: string, status: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Unauthorized" };

  await prisma.talentPoolEntry.update({
    where: { id, tenantId: owner.id },
    data: { status },
  });

  revalidatePath("/africs/hr/talent-pool");
  revalidatePath(`/africs/hr/talent-pool/${id}`);
  return { success: true };
}

export async function deleteTalentPoolEntry(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Unauthorized" };

  await prisma.talentPoolEntry.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/hr/talent-pool");
  return { success: true };
}

export async function getTalentPoolStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { total: 0, new: 0, reviewed: 0, shortlisted: 0, archived: 0 };

  const rows = await prisma.talentPoolEntry.groupBy({
    by: ["status"],
    where: { tenantId: owner.id },
    _count: true,
  });

  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = r._count;

  return {
    total: rows.reduce((s, r) => s + r._count, 0),
    new: byStatus.new ?? 0,
    reviewed: byStatus.reviewed ?? 0,
    shortlisted: byStatus.shortlisted ?? 0,
    archived: byStatus.archived ?? 0,
  };
}
