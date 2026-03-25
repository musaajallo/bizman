"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "./tenants";

const DEFAULT_CRITERIA = [
  "Communication",
  "Technical Skills",
  "Teamwork",
  "Initiative",
  "Reliability",
  "Quality of Work",
];

function serializeCycle(c: {
  id: string; tenantId: string; name: string;
  startDate: Date; endDate: Date; status: string;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function serializeAppraisal(a: {
  id: string; tenantId: string; cycleId: string; employeeId: string; managerId: string | null;
  status: string; selfRating: number | null; selfComments: string | null; selfSubmittedAt: Date | null;
  managerRating: number | null; managerComments: string | null; managerSubmittedAt: Date | null;
  finalRating: number | null; finalComments: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    ...a,
    selfSubmittedAt: a.selfSubmittedAt?.toISOString() ?? null,
    managerSubmittedAt: a.managerSubmittedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ── Cycles ────────────────────────────────────────────────────────────────────

export async function getAppraisalCycles(filters?: { status?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;

  const cycles = await prisma.appraisalCycle.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: { _count: { select: { appraisals: true } } },
  });

  return cycles.map((c) => ({ ...serializeCycle(c), _count: c._count }));
}

export async function getAppraisalCycleById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const c = await prisma.appraisalCycle.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      _count: { select: { appraisals: true } },
      appraisals: {
        orderBy: { createdAt: "asc" },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, photoUrl: true } },
        },
      },
    },
  });
  if (!c) return null;

  return {
    ...serializeCycle(c),
    _count: c._count,
    appraisals: c.appraisals.map((a) => serializeAppraisal(a)),
    employees: c.appraisals.map((a) => a.employee),
  };
}

export async function createAppraisalCycle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const c = await prisma.appraisalCycle.create({
    data: {
      tenantId: owner.id,
      name: formData.get("name") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      status: "draft",
    },
  });

  revalidatePath("/africs/hr/appraisals");
  return { id: c.id };
}

export async function updateAppraisalCycle(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.appraisalCycle.update({
    where: { id, tenantId: owner.id },
    data: {
      name: formData.get("name") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
    },
  });

  revalidatePath("/africs/hr/appraisals");
  revalidatePath(`/africs/hr/appraisals/cycles/${id}`);
  return { success: true };
}

export async function activateAppraisalCycle(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const activeEmployees = await prisma.employee.findMany({
    where: { tenantId: owner.id, status: { notIn: ["terminated", "resigned"] } },
    select: { id: true, managerId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.appraisalCycle.update({ where: { id, tenantId: owner.id }, data: { status: "active" } });

    for (const emp of activeEmployees) {
      const existing = await tx.appraisal.findUnique({ where: { cycleId_employeeId: { cycleId: id, employeeId: emp.id } } });
      if (existing) continue;

      const appraisal = await tx.appraisal.create({
        data: {
          tenantId: owner.id,
          cycleId: id,
          employeeId: emp.id,
          managerId: emp.managerId,
          status: "pending",
        },
      });

      await tx.appraisalRating.createMany({
        data: DEFAULT_CRITERIA.map((criterion) => ({ appraisalId: appraisal.id, criterion })),
      });
    }
  });

  revalidatePath("/africs/hr/appraisals");
  revalidatePath(`/africs/hr/appraisals/cycles/${id}`);
  return { success: true };
}

export async function closeAppraisalCycle(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.appraisalCycle.update({ where: { id, tenantId: owner.id }, data: { status: "closed" } });
  revalidatePath("/africs/hr/appraisals");
  revalidatePath(`/africs/hr/appraisals/cycles/${id}`);
  return { success: true };
}

export async function deleteAppraisalCycle(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const cycle = await prisma.appraisalCycle.findUnique({ where: { id, tenantId: owner.id } });
  if (!cycle) return { error: "Not found" };
  if (cycle.status !== "draft") return { error: "Only draft cycles can be deleted" };

  await prisma.appraisalCycle.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/hr/appraisals");
  return { success: true };
}

// ── Appraisals ────────────────────────────────────────────────────────────────

export async function getAppraisalById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const a = await prisma.appraisal.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      cycle: true,
      employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, photoUrl: true } },
      ratings: { orderBy: { criterion: "asc" } },
      goals: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!a) return null;

  return {
    ...serializeAppraisal(a),
    cycle: serializeCycle(a.cycle),
    employee: a.employee,
    ratings: a.ratings,
    goals: a.goals.map((g) => ({
      ...g,
      targetDate: g.targetDate?.toISOString() ?? null,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    })),
  };
}

export async function submitSelfAssessment(
  id: string,
  data: { selfRating: number; selfComments: string; ratings: { criterion: string; selfScore: number }[] }
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.$transaction(async (tx) => {
    await tx.appraisal.update({
      where: { id, tenantId: owner.id },
      data: {
        selfRating: data.selfRating,
        selfComments: data.selfComments,
        selfSubmittedAt: new Date(),
        status: "manager_review",
      },
    });

    for (const r of data.ratings) {
      await tx.appraisalRating.updateMany({
        where: { appraisalId: id, criterion: r.criterion },
        data: { selfScore: r.selfScore },
      });
    }
  });

  revalidatePath(`/africs/hr/appraisals/${id}`);
  return { success: true };
}

export async function submitManagerReview(
  id: string,
  data: { managerRating: number; managerComments: string; ratings: { criterion: string; managerScore: number }[] }
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.$transaction(async (tx) => {
    await tx.appraisal.update({
      where: { id, tenantId: owner.id },
      data: {
        managerRating: data.managerRating,
        managerComments: data.managerComments,
        managerSubmittedAt: new Date(),
        finalRating: data.managerRating,
        status: "completed",
      },
    });

    for (const r of data.ratings) {
      await tx.appraisalRating.updateMany({
        where: { appraisalId: id, criterion: r.criterion },
        data: { managerScore: r.managerScore },
      });
    }
  });

  revalidatePath(`/africs/hr/appraisals/${id}`);
  return { success: true };
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function addGoal(appraisalId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const appraisal = await prisma.appraisal.findUnique({ where: { id: appraisalId, tenantId: owner.id } });
  if (!appraisal) return { error: "Not found" };

  await prisma.appraisalGoal.create({
    data: {
      appraisalId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      targetDate: formData.get("targetDate") ? new Date(formData.get("targetDate") as string) : null,
      status: "not_started",
      progress: 0,
    },
  });

  revalidatePath(`/africs/hr/appraisals/${appraisalId}`);
  return { success: true };
}

export async function updateGoal(goalId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const goal = await prisma.appraisalGoal.findUnique({
    where: { id: goalId },
    include: { appraisal: { select: { tenantId: true } } },
  });
  if (!goal || goal.appraisal.tenantId !== owner.id) return { error: "Not found" };

  await prisma.appraisalGoal.update({
    where: { id: goalId },
    data: {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      targetDate: formData.get("targetDate") ? new Date(formData.get("targetDate") as string) : null,
      status: (formData.get("status") as string) || "not_started",
      progress: parseInt(formData.get("progress") as string) || 0,
    },
  });

  revalidatePath(`/africs/hr/appraisals/${goal.appraisalId}`);
  return { success: true };
}

export async function deleteGoal(goalId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const goal = await prisma.appraisalGoal.findUnique({
    where: { id: goalId },
    include: { appraisal: { select: { tenantId: true, id: true } } },
  });
  if (!goal || goal.appraisal.tenantId !== owner.id) return { error: "Not found" };

  await prisma.appraisalGoal.delete({ where: { id: goalId } });
  revalidatePath(`/africs/hr/appraisals/${goal.appraisalId}`);
  return { success: true };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getAppraisalStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { activeCycles: 0, totalAppraisals: 0, completed: 0, pending: 0, avgRating: 0 };

  const [activeCycles, statusGroups, ratingAgg] = await Promise.all([
    prisma.appraisalCycle.count({ where: { tenantId: owner.id, status: "active" } }),
    prisma.appraisal.groupBy({ by: ["status"], where: { tenantId: owner.id }, _count: true }),
    prisma.appraisal.aggregate({
      where: { tenantId: owner.id, finalRating: { not: null } },
      _avg: { finalRating: true },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const r of statusGroups) byStatus[r.status] = r._count;

  return {
    activeCycles,
    totalAppraisals: statusGroups.reduce((s, r) => s + r._count, 0),
    completed: byStatus.completed ?? 0,
    pending: (byStatus.pending ?? 0) + (byStatus.self_review ?? 0) + (byStatus.manager_review ?? 0),
    avgRating: ratingAgg._avg.finalRating ? Math.round(ratingAgg._avg.finalRating * 10) / 10 : 0,
  };
}
