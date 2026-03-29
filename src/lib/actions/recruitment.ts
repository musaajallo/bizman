"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "./tenants";

function toNum(d: unknown): number {
  if (d == null) return 0;
  return Number(d);
}

function serializePosting(p: {
  id: string; tenantId: string; title: string; department: string | null;
  employmentType: string | null; location: string | null; isRemote: boolean;
  salaryMin: unknown; salaryMax: unknown; salaryCurrency: string;
  description: string | null; requirements: string | null; status: string;
  publishedAt: Date | null; closingDate: Date | null; filledAt: Date | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...p,
    salaryMin: p.salaryMin != null ? toNum(p.salaryMin) : null,
    salaryMax: p.salaryMax != null ? toNum(p.salaryMax) : null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    closingDate: p.closingDate?.toISOString() ?? null,
    filledAt: p.filledAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ── Job Postings ──────────────────────────────────────────────────────────────

export async function getJobPostings(filters?: { status?: string; department?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.department) where.department = filters.department;

  const postings = await prisma.jobPosting.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return postings.map((p) => ({ ...serializePosting(p), _count: p._count }));
}

export async function getJobPostingById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const p = await prisma.jobPosting.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      _count: { select: { applications: true } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: { talentPoolEntry: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!p) return null;

  return {
    ...serializePosting(p),
    _count: p._count,
    applications: p.applications.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  };
}

export async function createJobPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const p = await prisma.jobPosting.create({
    data: {
      tenantId: owner.id,
      title: formData.get("title") as string,
      department: (formData.get("department") as string) || null,
      employmentType: (formData.get("employmentType") as string) || null,
      location: (formData.get("location") as string) || null,
      isRemote: formData.get("isRemote") === "true",
      salaryMin: formData.get("salaryMin") ? parseFloat(formData.get("salaryMin") as string) : null,
      salaryMax: formData.get("salaryMax") ? parseFloat(formData.get("salaryMax") as string) : null,
      salaryCurrency: (formData.get("salaryCurrency") as string) || "GMD",
      description: (formData.get("description") as string) || null,
      requirements: (formData.get("requirements") as string) || null,
      status: "draft",
    },
  });

  revalidatePath("/africs/hr/recruitment");
  return { id: p.id };
}

export async function updateJobPosting(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.jobPosting.update({
    where: { id, tenantId: owner.id },
    data: {
      title: formData.get("title") as string,
      department: (formData.get("department") as string) || null,
      employmentType: (formData.get("employmentType") as string) || null,
      location: (formData.get("location") as string) || null,
      isRemote: formData.get("isRemote") === "true",
      salaryMin: formData.get("salaryMin") ? parseFloat(formData.get("salaryMin") as string) : null,
      salaryMax: formData.get("salaryMax") ? parseFloat(formData.get("salaryMax") as string) : null,
      salaryCurrency: (formData.get("salaryCurrency") as string) || "GMD",
      description: (formData.get("description") as string) || null,
      requirements: (formData.get("requirements") as string) || null,
    },
  });

  revalidatePath("/africs/hr/recruitment");
  revalidatePath(`/africs/hr/recruitment/postings/${id}`);
  return { success: true };
}

export async function updateJobPostingStatus(id: string, status: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.jobPosting.update({
    where: { id, tenantId: owner.id },
    data: {
      status,
      publishedAt: status === "open" ? new Date() : undefined,
      filledAt: status === "filled" ? new Date() : undefined,
    },
  });

  revalidatePath("/africs/hr/recruitment");
  revalidatePath(`/africs/hr/recruitment/postings/${id}`);
  return { success: true };
}

export async function deleteJobPosting(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.jobPosting.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/hr/recruitment");
  return { success: true };
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function getApplications(filters?: { jobPostingId?: string; stage?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.jobPostingId) where.jobPostingId = filters.jobPostingId;
  if (filters?.stage) where.stage = filters.stage;

  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { jobPosting: { select: { id: true, title: true, department: true } } },
  });

  return apps.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
}

export async function getApplicationById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const a = await prisma.application.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      jobPosting: true,
      talentPoolEntry: { select: { id: true, name: true, email: true, phone: true, linkedInUrl: true, skills: true, experienceLevel: true } },
      hiredEmployee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
    },
  });
  if (!a) return null;

  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    jobPosting: {
      ...a.jobPosting,
      salaryMin: a.jobPosting.salaryMin != null ? toNum(a.jobPosting.salaryMin) : null,
      salaryMax: a.jobPosting.salaryMax != null ? toNum(a.jobPosting.salaryMax) : null,
      publishedAt: a.jobPosting.publishedAt?.toISOString() ?? null,
      closingDate: a.jobPosting.closingDate?.toISOString() ?? null,
      filledAt: a.jobPosting.filledAt?.toISOString() ?? null,
      createdAt: a.jobPosting.createdAt.toISOString(),
      updatedAt: a.jobPosting.updatedAt.toISOString(),
    },
  };
}

export async function createApplication(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const a = await prisma.application.create({
    data: {
      tenantId: owner.id,
      jobPostingId: formData.get("jobPostingId") as string,
      candidateName: formData.get("candidateName") as string,
      candidateEmail: (formData.get("candidateEmail") as string) || null,
      candidatePhone: (formData.get("candidatePhone") as string) || null,
      resumeUrl: (formData.get("resumeUrl") as string) || null,
      coverLetter: (formData.get("coverLetter") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/hr/recruitment");
  return { id: a.id };
}

export async function createApplicationFromTalentPool(jobPostingId: string, talentPoolEntryId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const entry = await prisma.talentPoolEntry.findUnique({ where: { id: talentPoolEntryId, tenantId: owner.id } });
  if (!entry) return { error: "Talent pool entry not found" };

  const existing = await prisma.application.findFirst({ where: { tenantId: owner.id, jobPostingId, talentPoolEntryId } });
  if (existing) return { error: "This candidate has already applied to this position" };

  const a = await prisma.application.create({
    data: {
      tenantId: owner.id,
      jobPostingId,
      talentPoolEntryId,
      candidateName: entry.name,
      candidateEmail: entry.email,
      candidatePhone: entry.phone,
    },
  });

  revalidatePath(`/africs/hr/recruitment/postings/${jobPostingId}`);
  return { id: a.id };
}

export async function moveApplicationStage(id: string, stage: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const a = await prisma.application.update({
    where: { id, tenantId: owner.id },
    data: { stage },
  });

  revalidatePath(`/africs/hr/recruitment/postings/${a.jobPostingId}`);
  revalidatePath(`/africs/hr/recruitment/applications/${id}`);
  return { success: true };
}

export async function rateApplication(id: string, rating: number) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.application.update({ where: { id, tenantId: owner.id }, data: { rating } });
  revalidatePath(`/africs/hr/recruitment/applications/${id}`);
  return { success: true };
}

export async function addApplicationNote(id: string, notes: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.application.update({ where: { id, tenantId: owner.id }, data: { notes } });
  revalidatePath(`/africs/hr/recruitment/applications/${id}`);
  return { success: true };
}

export async function rejectApplication(id: string, reason?: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const a = await prisma.application.update({
    where: { id, tenantId: owner.id },
    data: { stage: "rejected", rejectionReason: reason ?? null },
  });

  revalidatePath(`/africs/hr/recruitment/postings/${a.jobPostingId}`);
  revalidatePath(`/africs/hr/recruitment/applications/${id}`);
  return { success: true };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getRecruitmentStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { openPositions: 0, totalApplications: 0, byStage: {} as Record<string, number> };

  const [openPositions, stageGroups] = await Promise.all([
    prisma.jobPosting.count({ where: { tenantId: owner.id, status: "open" } }),
    prisma.application.groupBy({
      by: ["stage"],
      where: { tenantId: owner.id },
      _count: true,
    }),
  ]);

  const byStage: Record<string, number> = {};
  for (const s of stageGroups) byStage[s.stage] = s._count;

  return {
    openPositions,
    totalApplications: stageGroups.reduce((s, r) => s + r._count, 0),
    byStage,
  };
}

// ── Hire Link ─────────────────────────────────────────────────────────────────

export async function linkApplicationToEmployee(applicationId: string, employeeId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const a = await prisma.application.update({
    where: { id: applicationId, tenantId: owner.id },
    data: { hiredEmployeeId: employeeId, stage: "hired" },
  });

  revalidatePath(`/africs/hr/recruitment/applications/${applicationId}`);
  revalidatePath(`/africs/hr/recruitment/postings/${a.jobPostingId}`);
  return { success: true };
}

export async function unlinkApplicationEmployee(applicationId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.application.update({
    where: { id: applicationId, tenantId: owner.id },
    data: { hiredEmployeeId: null },
  });

  revalidatePath(`/africs/hr/recruitment/applications/${applicationId}`);
  return { success: true };
}
