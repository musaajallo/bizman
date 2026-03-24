"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";
import { getWeekStart } from "@/lib/timesheet-constants";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

function serializeTimesheet(t: {
  id: string; tenantId: string; employeeId: string;
  status: string; notes: string | null;
  weekStart: Date; submittedAt: Date | null; reviewedAt: Date | null; reviewedById: string | null;
  createdAt: Date; updatedAt: Date;
  totalHours: unknown;
}) {
  return {
    id: t.id,
    tenantId: t.tenantId,
    employeeId: t.employeeId,
    status: t.status,
    notes: t.notes,
    reviewedById: t.reviewedById,
    totalHours: toNum(t.totalHours),
    weekStart: t.weekStart.toISOString(),
    submittedAt: t.submittedAt?.toISOString() ?? null,
    reviewedAt: t.reviewedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getTimesheets(filters?: {
  status?: string;
  employeeId?: string;
  weekStart?: string;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.weekStart) where.weekStart = new Date(filters.weekStart);

  const timesheets = await prisma.timesheet.findMany({
    where,
    orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, photoUrl: true } },
    },
  });

  return timesheets.map((t) => ({
    ...serializeTimesheet(t),
    employee: t.employee,
  }));
}

export async function getTimesheet(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const t = await prisma.timesheet.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true, department: true, photoUrl: true } },
      reviewedBy: { select: { id: true, name: true } },
      entries: {
        orderBy: [{ date: "asc" }],
        include: { project: { select: { id: true, name: true } } },
      },
    },
  });
  if (!t) return null;

  return {
    ...serializeTimesheet(t),
    employee: t.employee,
    reviewedBy: t.reviewedBy,
    entries: t.entries.map((e) => ({
      id: e.id,
      timesheetId: e.timesheetId,
      date: e.date.toISOString(),
      hours: toNum(e.hours),
      category: e.category,
      projectId: e.projectId,
      description: e.description,
      project: e.project,
    })),
  };
}

export async function getTimesheetByWeek(employeeId: string, weekStart: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const t = await prisma.timesheet.findUnique({
    where: {
      tenantId_employeeId_weekStart: {
        tenantId: owner.id,
        employeeId,
        weekStart: new Date(weekStart),
      },
    },
  });
  if (!t) return null;

  return serializeTimesheet(t);
}

export async function getTimesheetStats() {
  const owner = await getOwnerBusiness();
  if (!owner) {
    return { totalThisWeek: 0, pendingApprovals: 0, approvedThisWeek: 0, avgWeeklyHours: 0 };
  }

  const now = new Date();
  const weekStart = getWeekStart(now);

  const [thisWeek, pending, approvedThisWeek, recentApproved] = await Promise.all([
    prisma.timesheet.count({ where: { tenantId: owner.id, weekStart } }),
    prisma.timesheet.count({ where: { tenantId: owner.id, status: "submitted" } }),
    prisma.timesheet.count({ where: { tenantId: owner.id, status: "approved", weekStart } }),
    prisma.timesheet.aggregate({
      where: { tenantId: owner.id, status: "approved" },
      _avg: { totalHours: true },
    }),
  ]);

  return {
    totalThisWeek: thisWeek,
    pendingApprovals: pending,
    approvedThisWeek: approvedThisWeek,
    avgWeeklyHours: toNum(recentApproved._avg.totalHours),
  };
}

export async function getTeamTimesheets(filters?: { status?: string; weekStart?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.weekStart) where.weekStart = new Date(filters.weekStart);

  const timesheets = await prisma.timesheet.findMany({
    where,
    orderBy: [{ weekStart: "desc" }, { status: "asc" }],
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, photoUrl: true } },
    },
  });

  return timesheets.map((t) => ({
    ...serializeTimesheet(t),
    employee: t.employee,
  }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createTimesheet(employeeId: string, weekStart: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const weekDate = new Date(weekStart);

  // Check for existing
  const existing = await prisma.timesheet.findUnique({
    where: {
      tenantId_employeeId_weekStart: {
        tenantId: owner.id,
        employeeId,
        weekStart: weekDate,
      },
    },
  });
  if (existing) return { id: existing.id, existing: true };

  const t = await prisma.timesheet.create({
    data: {
      tenantId: owner.id,
      employeeId,
      weekStart: weekDate,
      status: "draft",
    },
  });

  revalidatePath("/africs/hr/timesheets");
  return { id: t.id, existing: false };
}

export interface EntryInput {
  date: string;       // ISO date string
  hours: number;
  category: string;
  projectId?: string | null;
  description?: string | null;
}

export async function saveTimesheetEntries(timesheetId: string, entries: EntryInput[]) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const timesheet = await prisma.timesheet.findFirst({ where: { id: timesheetId, tenantId: owner.id } });
  if (!timesheet) return { error: "Not found" };
  if (timesheet.status !== "draft") return { error: "Only draft timesheets can be edited" };

  // Filter out zero-hour entries
  const valid = entries.filter((e) => e.hours > 0);

  const totalHours = valid.reduce((sum, e) => sum + e.hours, 0);

  await prisma.$transaction([
    prisma.timesheetEntry.deleteMany({ where: { timesheetId } }),
    prisma.timesheetEntry.createMany({
      data: valid.map((e) => ({
        timesheetId,
        date: new Date(e.date),
        hours: e.hours,
        category: e.category,
        projectId: e.projectId ?? null,
        description: e.description ?? null,
      })),
    }),
    prisma.timesheet.update({
      where: { id: timesheetId },
      data: { totalHours: parseFloat(totalHours.toFixed(2)) },
    }),
  ]);

  revalidatePath("/africs/hr/timesheets");
  return { success: true as const };
}

export async function submitTimesheet(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const t = await prisma.timesheet.findFirst({ where: { id, tenantId: owner.id } });
  if (!t) return { error: "Not found" };
  if (t.status !== "draft") return { error: "Only draft timesheets can be submitted" };
  if (toNum(t.totalHours) === 0) return { error: "Cannot submit an empty timesheet" };

  await prisma.timesheet.update({
    where: { id },
    data: { status: "submitted", submittedAt: new Date() },
  });

  revalidatePath("/africs/hr/timesheets");
  return { success: true as const };
}

export async function approveTimesheet(id: string, notes?: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const t = await prisma.timesheet.findFirst({ where: { id, tenantId: owner.id } });
  if (!t) return { error: "Not found" };
  if (t.status !== "submitted") return { error: "Only submitted timesheets can be approved" };

  await prisma.timesheet.update({
    where: { id },
    data: {
      status: "approved",
      notes: notes ?? null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/africs/hr/timesheets");
  return { success: true as const };
}

export async function rejectTimesheet(id: string, notes: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const t = await prisma.timesheet.findFirst({ where: { id, tenantId: owner.id } });
  if (!t) return { error: "Not found" };
  if (t.status !== "submitted") return { error: "Only submitted timesheets can be rejected" };
  if (!notes?.trim()) return { error: "A rejection note is required" };

  await prisma.timesheet.update({
    where: { id },
    data: {
      status: "rejected",
      notes: notes.trim(),
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/africs/hr/timesheets");
  return { success: true as const };
}

export async function reopenTimesheet(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const t = await prisma.timesheet.findFirst({ where: { id, tenantId: owner.id } });
  if (!t) return { error: "Not found" };
  if (t.status !== "rejected") return { error: "Only rejected timesheets can be reopened" };

  await prisma.timesheet.update({
    where: { id },
    data: {
      status: "draft",
      notes: null,
      reviewedById: null,
      reviewedAt: null,
      submittedAt: null,
    },
  });

  revalidatePath("/africs/hr/timesheets");
  return { success: true as const };
}

export async function deleteTimesheet(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const t = await prisma.timesheet.findFirst({ where: { id, tenantId: owner.id } });
  if (!t) return { error: "Not found" };
  if (!["draft", "rejected"].includes(t.status)) return { error: "Only draft or rejected timesheets can be deleted" };

  await prisma.timesheet.delete({ where: { id } });

  revalidatePath("/africs/hr/timesheets");
  return { success: true as const };
}
