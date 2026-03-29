"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getTenantId(): Promise<string | null> {
  const owner = await getOwnerBusiness();
  return owner?.id ?? null;
}

// ─── Shifts ──────────────────────────────────────────────────────────────────

export async function getShifts() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.shift.findMany({
    where: { tenantId },
    include: { _count: { select: { assignments: true, logs: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getShift(id: string) {
  return prisma.shift.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
        orderBy: { effectiveFrom: "desc" },
      },
    },
  });
}

export async function createShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Shift name is required" };

  const isDefault = formData.get("isDefault") === "true";

  // Only one default shift allowed
  if (isDefault) {
    await prisma.shift.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
  }

  const workDays = (formData.get("workDays") as string)
    ?.split(",").map((d) => d.trim()).filter(Boolean) ?? ["mon", "tue", "wed", "thu", "fri"];

  const shift = await prisma.shift.create({
    data: {
      tenantId,
      name: name.trim(),
      type: (formData.get("type") as string) || "fixed",
      startTime: (formData.get("startTime") as string) || "08:00",
      endTime: (formData.get("endTime") as string) || "17:00",
      breakMinutes: parseInt(formData.get("breakMinutes") as string) || 60,
      gracePeriodMins: parseInt(formData.get("gracePeriodMins") as string) || 15,
      overtimeAfterMins: parseInt(formData.get("overtimeAfterMins") as string) || 0,
      workDays,
      isDefault,
    },
  });

  revalidatePath("/africs/hr/attendance");
  return { success: true, id: shift.id };
}

export async function updateShift(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  const isDefault = formData.get("isDefault") === "true";
  if (isDefault) {
    await prisma.shift.updateMany({ where: { tenantId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
  }

  const workDays = (formData.get("workDays") as string)
    ?.split(",").map((d) => d.trim()).filter(Boolean) ?? ["mon", "tue", "wed", "thu", "fri"];

  await prisma.shift.update({
    where: { id },
    data: {
      name: (formData.get("name") as string)?.trim(),
      type: (formData.get("type") as string) || "fixed",
      startTime: (formData.get("startTime") as string) || "08:00",
      endTime: (formData.get("endTime") as string) || "17:00",
      breakMinutes: parseInt(formData.get("breakMinutes") as string) || 60,
      gracePeriodMins: parseInt(formData.get("gracePeriodMins") as string) || 15,
      overtimeAfterMins: parseInt(formData.get("overtimeAfterMins") as string) || 0,
      workDays,
      isDefault,
      isActive: formData.get("isActive") !== "false",
    },
  });

  revalidatePath("/africs/hr/attendance");
  return { success: true };
}

export async function deleteShift(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.shift.delete({ where: { id } });
  revalidatePath("/africs/hr/attendance");
  return { success: true };
}

export async function assignShift(shiftId: string, data: {
  employeeId?: string;
  department?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  await prisma.shiftAssignment.create({
    data: {
      tenantId,
      shiftId,
      employeeId: data.employeeId || null,
      department: data.department || null,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
    },
  });

  revalidatePath("/africs/hr/attendance");
  return { success: true };
}

// ─── Attendance Records (raw clock events) ───────────────────────────────────

export async function getAttendanceRecords(filters?: {
  employeeId?: string;
  from?: string;
  to?: string;
  source?: string;
}) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  const where: Record<string, unknown> = { tenantId };
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.source) where.source = filters.source;
  if (filters?.from || filters?.to) {
    where.timestamp = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
    };
  }

  return prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
      device: { select: { id: true, name: true, type: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });
}

export async function createManualRecord(data: {
  employeeId: string;
  type: string;
  timestamp: string;
  note?: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  await prisma.attendanceRecord.create({
    data: {
      tenantId,
      employeeId: data.employeeId,
      type: data.type,
      method: "manual",
      source: "manual",
      isManual: true,
      timestamp: new Date(data.timestamp),
      overriddenById: userId,
      note: data.note?.trim() || null,
    },
  });

  revalidatePath("/africs/hr/attendance");
  return { success: true };
}

export async function deleteAttendanceRecord(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.attendanceRecord.delete({ where: { id } });
  revalidatePath("/africs/hr/attendance");
  return { success: true };
}

// ─── Attendance Logs (processed daily summaries) ─────────────────────────────

export async function getAttendanceLogs(filters?: {
  employeeId?: string;
  from?: string;
  to?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  const where: Record<string, unknown> = { tenantId };
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.status) where.status = filters.status;
  if (filters?.from || filters?.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  return prisma.attendanceLog.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
      shift: { select: { id: true, name: true, startTime: true, endTime: true } },
    },
    orderBy: [{ date: "desc" }, { employee: { firstName: "asc" } }],
    take: 200,
  });
}

export async function updateAttendanceLog(id: string, data: {
  status?: string;
  actualClockIn?: string;
  actualClockOut?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const log = await prisma.attendanceLog.findUnique({ where: { id } });
  if (!log) return { error: "Log not found" };

  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.actualClockIn !== undefined) updateData.actualClockIn = data.actualClockIn ? new Date(data.actualClockIn) : null;
  if (data.actualClockOut !== undefined) updateData.actualClockOut = data.actualClockOut ? new Date(data.actualClockOut) : null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  // Recalculate if clock times changed
  if (data.actualClockIn !== undefined || data.actualClockOut !== undefined) {
    const clockIn = data.actualClockIn ? new Date(data.actualClockIn) : log.actualClockIn;
    const clockOut = data.actualClockOut ? new Date(data.actualClockOut) : log.actualClockOut;
    if (clockIn && clockOut) {
      const workedMs = clockOut.getTime() - clockIn.getTime();
      const breakMs = (log.breakMinutes ?? 0) * 60000;
      updateData.hoursWorked = Math.max(0, (workedMs - breakMs) / 3600000).toFixed(2);
    }
  }

  await prisma.attendanceLog.update({ where: { id }, data: updateData });
  revalidatePath("/africs/hr/attendance");
  return { success: true };
}

// ─── Daily Log Processing ─────────────────────────────────────────────────────

export async function processAttendanceForDate(date: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  // Get all records for the day
  const records = await prisma.attendanceRecord.findMany({
    where: { tenantId, timestamp: { gte: dateStart, lte: dateEnd } },
    orderBy: { timestamp: "asc" },
  });

  // Group by employee
  const byEmployee: Record<string, typeof records> = {};
  for (const r of records) {
    if (!byEmployee[r.employeeId]) byEmployee[r.employeeId] = [];
    byEmployee[r.employeeId].push(r);
  }

  const today = new Date(date);
  const dayName = ["sun","mon","tue","wed","thu","fri","sat"][today.getDay()];
  let processed = 0;

  for (const [employeeId, empRecords] of Object.entries(byEmployee)) {
    // Resolve shift
    const shift = await resolveShift(tenantId, employeeId, today, dayName);

    const clockIns  = empRecords.filter((r) => r.type === "clock_in");
    const clockOuts = empRecords.filter((r) => r.type === "clock_out");

    const actualClockIn  = clockIns.at(0)?.timestamp ?? null;
    const actualClockOut = clockOuts.at(-1)?.timestamp ?? null;

    let hoursWorked: number | null = null;
    let lateMinutes = 0;
    let earlyDepartureMinutes = 0;
    let overtimeMinutes = 0;
    const breakMinutes = shift?.breakMinutes ?? 0;

    if (actualClockIn && actualClockOut) {
      const workedMs = actualClockOut.getTime() - actualClockIn.getTime();
      hoursWorked = Math.max(0, (workedMs - breakMinutes * 60000) / 3600000);

      if (shift) {
        const [sh, sm] = shift.startTime.split(":").map(Number);
        const [eh, em] = shift.endTime.split(":").map(Number);
        const shiftStartMs = (sh * 60 + sm) * 60000;
        const shiftEndMs   = (eh * 60 + em) * 60000;
        const clockInMs    = actualClockIn.getHours() * 3600000 + actualClockIn.getMinutes() * 60000;
        const clockOutMs   = actualClockOut.getHours() * 3600000 + actualClockOut.getMinutes() * 60000;
        const graceMs      = shift.gracePeriodMins * 60000;

        lateMinutes = Math.max(0, Math.round((clockInMs - shiftStartMs - graceMs) / 60000));
        earlyDepartureMinutes = Math.max(0, Math.round((shiftEndMs - graceMs - clockOutMs) / 60000));
        const shiftDurationMs = shiftEndMs - shiftStartMs - breakMinutes * 60000;
        const workedNetMs = workedMs - breakMinutes * 60000;
        const otAfterMs = (shift.overtimeAfterMins ?? 0) * 60000;
        overtimeMinutes = Math.max(0, Math.round((workedNetMs - shiftDurationMs - otAfterMs) / 60000));
      }
    }

    let status = "unresolved";
    if (shift && !shift.workDays.includes(dayName)) {
      status = "weekend";
    } else if (actualClockIn && actualClockOut) {
      const shiftHours = shift ? (() => {
        const [sh, sm] = shift.startTime.split(":").map(Number);
        const [eh, em] = shift.endTime.split(":").map(Number);
        return ((eh * 60 + em) - (sh * 60 + sm) - shift.breakMinutes) / 60;
      })() : 8;
      status = (hoursWorked ?? 0) >= shiftHours * 0.5 ? "present" : "half_day";
    } else if (actualClockIn) {
      status = "present";
    }

    await prisma.attendanceLog.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: {
        status,
        shiftId: shift?.id ?? null,
        scheduledStart: shift ? (() => { const d = new Date(date); const [h,m] = shift.startTime.split(":").map(Number); d.setHours(h,m,0,0); return d; })() : null,
        scheduledEnd:   shift ? (() => { const d = new Date(date); const [h,m] = shift.endTime.split(":").map(Number);   d.setHours(h,m,0,0); return d; })() : null,
        actualClockIn,
        actualClockOut,
        hoursWorked: hoursWorked !== null ? hoursWorked.toFixed(2) : null,
        lateMinutes,
        earlyDepartureMinutes,
        overtimeMinutes,
        breakMinutes,
        processedAt: new Date(),
      },
      create: {
        tenantId,
        employeeId,
        date: new Date(date),
        status,
        shiftId: shift?.id ?? null,
        scheduledStart: shift ? (() => { const d = new Date(date); const [h,m] = shift.startTime.split(":").map(Number); d.setHours(h,m,0,0); return d; })() : null,
        scheduledEnd:   shift ? (() => { const d = new Date(date); const [h,m] = shift.endTime.split(":").map(Number);   d.setHours(h,m,0,0); return d; })() : null,
        actualClockIn,
        actualClockOut,
        hoursWorked: hoursWorked !== null ? hoursWorked.toFixed(2) : null,
        lateMinutes,
        earlyDepartureMinutes,
        overtimeMinutes,
        breakMinutes,
      },
    });
    processed++;
  }

  revalidatePath("/africs/hr/attendance");
  return { success: true, processed };
}

async function resolveShift(tenantId: string, employeeId: string, date: Date, _dayName: string) {
  const now = date;
  // 1. Direct employee assignment
  const direct = await prisma.shiftAssignment.findFirst({
    where: {
      tenantId,
      employeeId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: { shift: true },
    orderBy: { effectiveFrom: "desc" },
  });
  if (direct?.shift) return direct.shift;

  // 2. Department assignment
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { department: true } });
  if (employee?.department) {
    const dept = await prisma.shiftAssignment.findFirst({
      where: {
        tenantId,
        employeeId: null,
        department: employee.department,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { shift: true },
      orderBy: { effectiveFrom: "desc" },
    });
    if (dept?.shift) return dept.shift;
  }

  // 3. Default shift
  return prisma.shift.findFirst({ where: { tenantId, isDefault: true, isActive: true } });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAttendanceDashboard() {
  const tenantId = await getTenantId();
  if (!tenantId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayStr = today.toISOString().split("T")[0];

  const [
    totalEmployees,
    todayRecords,
    todayLogs,
    recentRecords,
  ] = await Promise.all([
    prisma.employee.count({ where: { tenantId, status: "active" } }),
    prisma.attendanceRecord.groupBy({
      by: ["employeeId"],
      where: { tenantId, timestamp: { gte: today, lte: todayEnd } },
    }),
    prisma.attendanceLog.findMany({
      where: { tenantId, date: new Date(todayStr) },
      select: { status: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { tenantId, timestamp: { gte: today, lte: todayEnd } },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    }),
  ]);

  const presentToday = todayRecords.length;
  const absentToday = totalEmployees - presentToday;
  const lateToday = todayLogs.filter((l) => l.status === "present").length; // simplified
  const statusCounts = todayLogs.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalEmployees,
    presentToday,
    absentToday: Math.max(0, absentToday),
    lateToday,
    statusCounts,
    recentRecords,
  };
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export async function getAttendanceDevices() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.attendanceDevice.findMany({
    where: { tenantId },
    include: { _count: { select: { records: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createAttendanceDevice(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Tenant not found" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Device name is required" };

  const device = await prisma.attendanceDevice.create({
    data: {
      tenantId,
      name: name.trim(),
      type: (formData.get("type") as string) || "manual",
      serialNumber: (formData.get("serialNumber") as string) || null,
      location: (formData.get("location") as string) || null,
    },
  });

  revalidatePath("/africs/hr/attendance");
  return { success: true, id: device.id, apiKey: device.apiKey };
}

export async function deleteAttendanceDevice(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.attendanceDevice.delete({ where: { id } });
  revalidatePath("/africs/hr/attendance");
  return { success: true };
}
