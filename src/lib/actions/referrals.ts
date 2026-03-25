"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "./tenants";

function serializeReferral(r: {
  id: string; tenantId: string; referrerId: string; jobPostingId: string | null;
  positionTitle: string; department: string | null; candidateName: string;
  candidateEmail: string | null; candidatePhone: string | null; candidateLinkedIn: string | null;
  resumeUrl: string | null; status: string; reviewNote: string | null;
  reviewedAt: Date | null; notes: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    ...r,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getReferrals(filters?: { status?: string; department?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.department) where.department = filters.department;

  const referrals = await prisma.referral.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      referrer: { select: { id: true, firstName: true, lastName: true, department: true, jobTitle: true } },
      jobPosting: { select: { id: true, title: true } },
    },
  });

  return referrals.map((r) => ({ ...serializeReferral(r), referrer: r.referrer, jobPosting: r.jobPosting }));
}

export async function getReferralById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const r = await prisma.referral.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      referrer: { select: { id: true, firstName: true, lastName: true, department: true, jobTitle: true, photoUrl: true } },
      jobPosting: { select: { id: true, title: true, status: true } },
    },
  });
  if (!r) return null;
  return { ...serializeReferral(r), referrer: r.referrer, jobPosting: r.jobPosting };
}

export async function createReferral(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const r = await prisma.referral.create({
    data: {
      tenantId: owner.id,
      referrerId: formData.get("referrerId") as string,
      jobPostingId: (formData.get("jobPostingId") as string) || null,
      positionTitle: formData.get("positionTitle") as string,
      department: (formData.get("department") as string) || null,
      candidateName: formData.get("candidateName") as string,
      candidateEmail: (formData.get("candidateEmail") as string) || null,
      candidatePhone: (formData.get("candidatePhone") as string) || null,
      candidateLinkedIn: (formData.get("candidateLinkedIn") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/hr/referrals");
  return { id: r.id };
}

export async function updateReferralStatus(id: string, status: string, reviewNote?: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.referral.update({
    where: { id, tenantId: owner.id },
    data: { status, reviewNote: reviewNote ?? null, reviewedAt: new Date() },
  });

  revalidatePath("/africs/hr/referrals");
  revalidatePath(`/africs/hr/referrals/${id}`);
  return { success: true };
}

export async function deleteReferral(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.referral.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/hr/referrals");
  return { success: true };
}

export async function getReferralStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { total: 0, submitted: 0, reviewed: 0, hired: 0, rejected: 0 };

  const rows = await prisma.referral.groupBy({
    by: ["status"],
    where: { tenantId: owner.id },
    _count: true,
  });
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = r._count;

  return {
    total: rows.reduce((s, r) => s + r._count, 0),
    submitted: byStatus.submitted ?? 0,
    reviewed: byStatus.reviewed ?? 0,
    interviewing: byStatus.interviewing ?? 0,
    hired: byStatus.hired ?? 0,
    rejected: byStatus.rejected ?? 0,
  };
}

export async function getReferralLeaderboard() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const rows = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { tenantId: owner.id },
    _count: true,
  });

  const hiredRows = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { tenantId: owner.id, status: "hired" },
    _count: true,
  });
  const hiredMap: Record<string, number> = {};
  for (const r of hiredRows) hiredMap[r.referrerId] = r._count;

  const employeeIds = rows.map((r) => r.referrerId);
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, firstName: true, lastName: true, department: true, jobTitle: true, photoUrl: true },
  });
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  return rows
    .map((r) => ({
      employee: empMap[r.referrerId],
      total: r._count,
      hired: hiredMap[r.referrerId] ?? 0,
    }))
    .sort((a, b) => b.hired - a.hired || b.total - a.total);
}
