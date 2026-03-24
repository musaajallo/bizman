"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

export type { LeaveTypeValue } from "@/lib/leave-types";

// ── Balances ──────────────────────────────────────────────────────────────────

export async function getLeaveBalances(employeeId: string, year?: number) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");
  const y = year ?? new Date().getFullYear();

  return prisma.leaveBalance.findMany({
    where: { tenantId: owner.id, employeeId, year: y },
    orderBy: { leaveType: "asc" },
  });
}

export async function getAllLeaveBalances(year?: number) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");
  const y = year ?? new Date().getFullYear();

  return prisma.leaveBalance.findMany({
    where: { tenantId: owner.id, year: y },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true, jobTitle: true },
      },
    },
    orderBy: [{ employee: { firstName: "asc" } }, { leaveType: "asc" }],
  });
}

export async function upsertLeaveBalance(
  employeeId: string,
  year: number,
  leaveType: string,
  allocated: number
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.leaveBalance.upsert({
    where: { employeeId_year_leaveType: { employeeId, year, leaveType } },
    create: { tenantId: owner.id, employeeId, year, leaveType, allocated, used: 0 },
    update: { allocated },
  });

  revalidatePath("/africs/hr/time-off");
  return { success: true };
}

export async function bulkAllocateLeaveBalances(
  year: number,
  leaveType: string,
  allocated: number,
  employeeIds?: string[] // undefined = all active employees
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const employees = await prisma.employee.findMany({
    where: {
      tenantId: owner.id,
      status: { in: ["active", "on_leave", "suspended"] },
      ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
    },
    select: { id: true },
  });

  await Promise.all(
    employees.map((e) =>
      prisma.leaveBalance.upsert({
        where: { employeeId_year_leaveType: { employeeId: e.id, year, leaveType } },
        create: { tenantId: owner.id, employeeId: e.id, year, leaveType, allocated, used: 0 },
        update: { allocated },
      })
    )
  );

  revalidatePath("/africs/hr/time-off");
  return { success: true, count: employees.length };
}

// ── Requests ──────────────────────────────────────────────────────────────────

export async function getLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
  leaveType?: string;
  year?: number;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.status) where.status = filters.status;
  if (filters?.leaveType) where.leaveType = filters.leaveType;
  if (filters?.year) {
    const start = new Date(filters.year, 0, 1);
    const end = new Date(filters.year + 1, 0, 1);
    where.startDate = { gte: start, lt: end };
  }

  return prisma.leaveRequest.findMany({
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
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeaveRequestById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  return prisma.leaveRequest.findFirst({
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
        },
      },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createLeaveRequest(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const employeeId = formData.get("employeeId") as string;
  const leaveType = formData.get("leaveType") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const reason = (formData.get("reason") as string) || null;

  if (!employeeId || !leaveType || !startDate || !endDate) {
    return { error: "Missing required fields" };
  }
  if (endDate < startDate) return { error: "End date must be after start date" };

  // Count business days (Mon–Fri)
  const days = countBusinessDays(startDate, endDate);

  const request = await prisma.leaveRequest.create({
    data: {
      tenantId: owner.id,
      employeeId,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: "pending",
    },
  });

  revalidatePath("/africs/hr/time-off");
  return { success: true, id: request.id };
}

export async function reviewLeaveRequest(
  id: string,
  action: "approved" | "rejected",
  note?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const request = await prisma.leaveRequest.findFirst({
    where: { id, tenantId: owner.id, status: "pending" },
  });
  if (!request) return { error: "Request not found or already reviewed" };

  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id },
      data: {
        status: action,
        reviewedById: session.user!.id,
        reviewNote: note || null,
        reviewedAt: new Date(),
      },
    });

    if (action === "approved") {
      // Increment used days on balance
      await tx.leaveBalance.upsert({
        where: {
          employeeId_year_leaveType: {
            employeeId: request.employeeId,
            year: request.startDate.getFullYear(),
            leaveType: request.leaveType,
          },
        },
        create: {
          tenantId: owner.id,
          employeeId: request.employeeId,
          year: request.startDate.getFullYear(),
          leaveType: request.leaveType,
          allocated: 0,
          used: request.days,
        },
        update: { used: { increment: request.days } },
      });
    }
  });

  revalidatePath("/africs/hr/time-off");
  return { success: true };
}

export async function cancelLeaveRequest(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const request = await prisma.leaveRequest.findFirst({
    where: { id, tenantId: owner.id },
  });
  if (!request) return { error: "Not found" };
  if (request.status === "cancelled") return { error: "Already cancelled" };

  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.update({ where: { id }, data: { status: "cancelled" } });

    // Refund used days if it was approved
    if (request.status === "approved") {
      await tx.leaveBalance.updateMany({
        where: {
          employeeId: request.employeeId,
          year: request.startDate.getFullYear(),
          leaveType: request.leaveType,
        },
        data: { used: { decrement: request.days } },
      });
    }
  });

  revalidatePath("/africs/hr/time-off");
  return { success: true };
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getLeaveDashboardStats(year?: number) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y + 1, 0, 1);

  const [pending, approved, onLeaveNow, totalRequests] = await Promise.all([
    prisma.leaveRequest.count({ where: { tenantId: owner.id, status: "pending" } }),
    prisma.leaveRequest.count({ where: { tenantId: owner.id, status: "approved", startDate: { gte: start, lt: end } } }),
    prisma.employee.count({ where: { tenantId: owner.id, status: "on_leave" } }),
    prisma.leaveRequest.count({ where: { tenantId: owner.id, startDate: { gte: start, lt: end } } }),
  ]);

  return { pending, approved, onLeaveNow, totalRequests };
}

export async function getLeaveCalendarData(month: number, year: number) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return prisma.leaveRequest.findMany({
    where: {
      tenantId: owner.id,
      status: "approved",
      startDate: { lt: end },
      endDate: { gte: start },
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, department: true, photoUrl: true },
      },
    },
    orderBy: { startDate: "asc" },
  });
}

// ── Sync employee on_leave status ─────────────────────────────────────────────

export async function syncEmployeeLeaveStatus(employeeId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLeave = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      tenantId: owner.id,
      status: "approved",
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { status: true, leaveType: true },
  });
  if (!employee) return;

  if (activeLeave && employee.status !== "on_leave") {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: "on_leave",
        leaveType: activeLeave.leaveType,
        leaveEndDate: activeLeave.endDate,
      },
    });
  } else if (!activeLeave && employee.status === "on_leave") {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: "active", leaveType: null, leaveEndDate: null },
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
