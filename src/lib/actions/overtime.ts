"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";
import { getWeekStart } from "@/lib/timesheet-constants";
import { calculateOvertimePay, type OvertimeTypeValue } from "@/lib/overtime-constants";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

function serializeRequest(r: {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  hours: unknown;
  overtimeType: string;
  reason: string;
  projectId: string | null;
  status: string;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    tenantId: r.tenantId,
    employeeId: r.employeeId,
    date: r.date.toISOString(),
    hours: toNum(r.hours),
    overtimeType: r.overtimeType,
    reason: r.reason,
    projectId: r.projectId,
    status: r.status,
    reviewedById: r.reviewedById,
    reviewNote: r.reviewNote,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getOvertimeRequests(filters?: {
  employeeId?: string;
  status?: string;
  month?: number;
  year?: number;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.status) where.status = filters.status;
  if (filters?.year) {
    const start = new Date(Date.UTC(filters.year, (filters.month ?? 1) - 1, 1));
    const end = filters.month
      ? new Date(Date.UTC(filters.year, filters.month, 1))
      : new Date(Date.UTC(filters.year + 1, 0, 1));
    where.date = { gte: start, lt: end };
  }

  const requests = await prisma.overtimeRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
          department: true,
          jobTitle: true,
          photoUrl: true,
        },
      },
      reviewer: {
        select: { id: true, firstName: true, lastName: true },
      },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    ...serializeRequest(r),
    employee: r.employee,
    reviewer: r.reviewer,
    project: r.project,
  }));
}

export async function getOvertimeRequestById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const r = await prisma.overtimeRequest.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
          department: true,
          jobTitle: true,
          photoUrl: true,
          basicSalary: true,
          currency: true,
          managerId: true,
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!r) return null;

  return {
    ...serializeRequest(r),
    employee: {
      ...r.employee,
      basicSalary: toNum(r.employee.basicSalary),
    },
    reviewer: r.reviewer,
    project: r.project,
  };
}

export async function getOvertimeDashboardStats(year?: number) {
  const owner = await getOwnerBusiness();
  if (!owner) return { pending: 0, approved: 0, rejected: 0, totalHoursApproved: 0 };

  const y = year ?? new Date().getFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const end = new Date(Date.UTC(y + 1, 0, 1));

  const [pending, approved, rejected, agg] = await Promise.all([
    prisma.overtimeRequest.count({ where: { tenantId: owner.id, status: "pending" } }),
    prisma.overtimeRequest.count({ where: { tenantId: owner.id, status: "approved", date: { gte: start, lt: end } } }),
    prisma.overtimeRequest.count({ where: { tenantId: owner.id, status: "rejected", date: { gte: start, lt: end } } }),
    prisma.overtimeRequest.aggregate({
      where: { tenantId: owner.id, status: "approved", date: { gte: start, lt: end } },
      _sum: { hours: true },
    }),
  ]);

  return {
    pending,
    approved,
    rejected,
    totalHoursApproved: toNum(agg._sum.hours),
  };
}

export async function getApprovedOvertimeForPayroll(employeeId: string, month: number, year: number) {
  const owner = await getOwnerBusiness();
  if (!owner) return { totalHours: 0, totalPay: 0, averageRate: 0 };

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const requests = await prisma.overtimeRequest.findMany({
    where: {
      tenantId: owner.id,
      employeeId,
      status: "approved",
      date: { gte: start, lt: end },
    },
    include: {
      employee: { select: { basicSalary: true, currency: true } },
    },
  });

  if (requests.length === 0) return { totalHours: 0, totalPay: 0, averageRate: 0 };

  let totalHours = 0;
  let totalPay = 0;

  for (const r of requests) {
    const hours = toNum(r.hours);
    const basic = toNum(r.employee.basicSalary);
    const { pay } = calculateOvertimePay(basic, hours, r.overtimeType as OvertimeTypeValue);
    totalHours += hours;
    totalPay += pay;
  }

  const averageRate = totalHours > 0 ? parseFloat((totalPay / totalHours).toFixed(2)) : 0;

  return { totalHours, totalPay: parseFloat(totalPay.toFixed(2)), averageRate };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createOvertimeRequest(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const employeeId = formData.get("employeeId") as string;
  const dateStr = formData.get("date") as string;
  const hoursStr = formData.get("hours") as string;
  const overtimeType = (formData.get("overtimeType") as string) || "standard";
  const reason = (formData.get("reason") as string)?.trim();
  const projectId = (formData.get("projectId") as string) || null;

  if (!employeeId || !dateStr || !hoursStr || !reason) {
    return { error: "Missing required fields" };
  }

  const hours = parseFloat(hoursStr);
  if (isNaN(hours) || hours <= 0 || hours > 16) {
    return { error: "Hours must be between 0 and 16" };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { error: "Invalid date" };

  const request = await prisma.overtimeRequest.create({
    data: {
      tenantId: owner.id,
      employeeId,
      date,
      hours,
      overtimeType,
      reason,
      projectId: projectId || null,
      status: "pending",
    },
    include: {
      employee: {
        select: { managerId: true, firstName: true, lastName: true, userId: true, manager: { select: { userId: true, firstName: true, lastName: true } } },
      },
    },
  });

  // Notify the manager if they have a linked user account
  if (request.employee.manager?.userId) {
    await prisma.notification.create({
      data: {
        userId: request.employee.manager.userId,
        tenantId: owner.id,
        type: "overtime_request",
        title: "Overtime Request Submitted",
        message: `${request.employee.firstName} ${request.employee.lastName} has submitted an overtime request for ${dateStr}.`,
        entityType: "overtime_request",
        entityId: request.id,
      },
    });
  }

  revalidatePath("/africs/hr/overtime");
  return { success: true, id: request.id };
}

export async function reviewOvertimeRequest(
  id: string,
  decision: "approved" | "rejected",
  reviewNote?: string
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const request = await prisma.overtimeRequest.findFirst({
    where: { id, tenantId: owner.id, status: "pending" },
    include: {
      employee: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          basicSalary: true,
          managerId: true,
        },
      },
    },
  });

  if (!request) return { error: "Request not found or already reviewed" };

  if (decision === "rejected" && !reviewNote?.trim()) {
    return { error: "A rejection reason is required" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.overtimeRequest.update({
      where: { id },
      data: {
        status: decision,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
    });

    if (decision === "approved") {
      await syncOvertimeToTimesheet(tx, owner.id, request);
    }
  });

  // Notify the employee if they have a linked user account
  if (request.employee.userId) {
    await prisma.notification.create({
      data: {
        userId: request.employee.userId,
        tenantId: owner.id,
        type: "overtime_reviewed",
        title: `Overtime Request ${decision === "approved" ? "Approved" : "Rejected"}`,
        message:
          decision === "approved"
            ? `Your overtime request for ${new Date(request.date).toISOString().slice(0, 10)} has been approved.`
            : `Your overtime request for ${new Date(request.date).toISOString().slice(0, 10)} was rejected. ${reviewNote ? `Reason: ${reviewNote}` : ""}`,
        entityType: "overtime_request",
        entityId: request.id,
      },
    });
  }

  revalidatePath("/africs/hr/overtime");
  return { success: true };
}

export async function cancelOvertimeRequest(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const request = await prisma.overtimeRequest.findFirst({
    where: { id, tenantId: owner.id },
  });
  if (!request) return { error: "Not found" };
  if (request.status === "approved") {
    return { error: "Approved requests cannot be cancelled. Contact HR." };
  }
  if (request.status === "rejected") {
    return { error: "Request is already rejected" };
  }

  await prisma.overtimeRequest.update({ where: { id }, data: { status: "rejected", reviewNote: "Cancelled by employee" } });

  revalidatePath("/africs/hr/overtime");
  return { success: true };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function syncOvertimeToTimesheet(
  tx: TransactionClient,
  tenantId: string,
  request: {
    id: string;
    employeeId: string;
    date: Date;
    hours: unknown;
    overtimeType: string;
    reason: string;
    projectId: string | null;
  }
) {
  const weekStart = getWeekStart(new Date(request.date));

  // Find or create the timesheet for this week
  const timesheet = await tx.timesheet.upsert({
    where: {
      tenantId_employeeId_weekStart: {
        tenantId,
        employeeId: request.employeeId,
        weekStart,
      },
    },
    create: {
      tenantId,
      employeeId: request.employeeId,
      weekStart,
      status: "approved",
      totalHours: 0,
    },
    update: {},
  });

  const overtimeLabel = request.overtimeType === "weekend"
    ? "weekend overtime"
    : request.overtimeType === "holiday"
    ? "holiday overtime"
    : "overtime";

  // Create the timesheet entry
  await tx.timesheetEntry.create({
    data: {
      timesheetId: timesheet.id,
      date: new Date(request.date),
      hours: toNum(request.hours),
      category: "overtime",
      projectId: request.projectId,
      description: `${overtimeLabel.charAt(0).toUpperCase() + overtimeLabel.slice(1)}: ${request.reason}`,
    },
  });

  // Recalculate total hours
  const agg = await tx.timesheetEntry.aggregate({
    where: { timesheetId: timesheet.id },
    _sum: { hours: true },
  });
  await tx.timesheet.update({
    where: { id: timesheet.id },
    data: { totalHours: toNum(agg._sum.hours) },
  });
}
