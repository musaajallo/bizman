"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

function toNum(d: unknown): number | null {
  if (d == null) return null;
  return Number(d);
}

function serializeMovement(m: {
  id: string; tenantId: string; employeeId: string; movementType: string;
  oldJobTitle: string | null; oldDepartment: string | null; oldUnit: string | null;
  oldBasicSalary: unknown; oldGrade: string | null;
  newJobTitle: string | null; newDepartment: string | null; newUnit: string | null;
  newBasicSalary: unknown; newGrade: string | null;
  effectiveDate: Date; reason: string | null; status: string; approvedById: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...m,
    oldBasicSalary: toNum(m.oldBasicSalary),
    newBasicSalary: toNum(m.newBasicSalary),
    effectiveDate: m.effectiveDate.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function getEmployeesForMovement() {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const employees = await prisma.employee.findMany({
    where: { tenantId: owner.id, status: { notIn: ["terminated", "resigned"] } },
    select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true, department: true, unit: true, basicSalary: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return employees.map((e) => ({ ...e, basicSalary: toNum(e.basicSalary) }));
}

// ── Staff Movements ────────────────────────────────────────────────────────────

export async function getStaffMovements(filters?: { employeeId?: string; movementType?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.movementType) where.movementType = filters.movementType;

  const movements = await prisma.staffMovement.findMany({
    where,
    orderBy: { effectiveDate: "desc" },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
    },
  });

  return movements.map((m) => ({ ...serializeMovement(m), employee: m.employee }));
}

export async function getStaffMovementById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const m = await prisma.staffMovement.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true, unit: true, jobTitle: true, basicSalary: true } },
    },
  });
  if (!m) return null;

  return {
    ...serializeMovement(m),
    employee: {
      ...m.employee,
      basicSalary: toNum(m.employee.basicSalary),
    },
  };
}

export async function createStaffMovement(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const employeeId = formData.get("employeeId") as string;
  const movementType = formData.get("movementType") as string;
  const effectiveDateStr = formData.get("effectiveDate") as string;
  const applyNow = formData.get("applyNow") === "true";

  const movement = await prisma.staffMovement.create({
    data: {
      tenantId: owner.id,
      employeeId,
      movementType,
      oldJobTitle: (formData.get("oldJobTitle") as string) || null,
      oldDepartment: (formData.get("oldDepartment") as string) || null,
      oldUnit: (formData.get("oldUnit") as string) || null,
      oldBasicSalary: formData.get("oldBasicSalary") ? parseFloat(formData.get("oldBasicSalary") as string) : null,
      oldGrade: (formData.get("oldGrade") as string) || null,
      newJobTitle: (formData.get("newJobTitle") as string) || null,
      newDepartment: (formData.get("newDepartment") as string) || null,
      newUnit: (formData.get("newUnit") as string) || null,
      newBasicSalary: formData.get("newBasicSalary") ? parseFloat(formData.get("newBasicSalary") as string) : null,
      newGrade: (formData.get("newGrade") as string) || null,
      effectiveDate: effectiveDateStr ? new Date(effectiveDateStr) : new Date(),
      reason: (formData.get("reason") as string) || null,
      status: "approved",
    },
  });

  // Optionally apply changes to employee record immediately
  if (applyNow) {
    const updateData: Record<string, unknown> = {};
    if (formData.get("newJobTitle")) updateData.jobTitle = formData.get("newJobTitle");
    if (formData.get("newDepartment")) updateData.department = formData.get("newDepartment");
    if (formData.get("newUnit")) updateData.unit = formData.get("newUnit");
    if (formData.get("newBasicSalary")) updateData.basicSalary = parseFloat(formData.get("newBasicSalary") as string);

    if (Object.keys(updateData).length > 0) {
      await prisma.employee.update({ where: { id: employeeId }, data: updateData });
    }
  }

  revalidatePath("/africs/hr/movements");
  revalidatePath(`/africs/hr/employees/${employeeId}`);
  return { id: movement.id };
}

export async function deleteStaffMovement(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const m = await prisma.staffMovement.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/hr/movements");
  revalidatePath(`/africs/hr/employees/${m.employeeId}`);
  return { success: true };
}

// ── Disciplinary Records ───────────────────────────────────────────────────────

export async function getDisciplinaryRecords(filters?: { employeeId?: string; actionType?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.actionType) where.actionType = filters.actionType;

  const records = await prisma.disciplinaryRecord.findMany({
    where,
    orderBy: { incidentDate: "desc" },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
    },
  });

  return records.map((r) => ({
    ...r,
    incidentDate: r.incidentDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getDisciplinaryRecordById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const r = await prisma.disciplinaryRecord.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true, department: true } },
    },
  });
  if (!r) return null;

  return {
    ...r,
    incidentDate: r.incidentDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createDisciplinaryRecord(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const record = await prisma.disciplinaryRecord.create({
    data: {
      tenantId: owner.id,
      employeeId: formData.get("employeeId") as string,
      actionType: formData.get("actionType") as string,
      incidentDate: new Date(formData.get("incidentDate") as string),
      incidentDescription: formData.get("incidentDescription") as string,
      actionTaken: (formData.get("actionTaken") as string) || null,
      status: "pending",
    },
  });

  revalidatePath("/africs/hr/movements");
  revalidatePath(`/africs/hr/employees/${record.employeeId}`);
  return { id: record.id };
}

export async function updateDisciplinaryStatus(id: string, status: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.disciplinaryRecord.update({
    where: { id, tenantId: owner.id },
    data: { status },
  });

  revalidatePath("/africs/hr/movements");
  return { success: true };
}

export async function acknowledgeDisciplinaryRecord(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.disciplinaryRecord.update({
    where: { id, tenantId: owner.id },
    data: { employeeAcknowledgement: true, status: "acknowledged" },
  });

  revalidatePath("/africs/hr/movements");
  return { success: true };
}

export async function deleteDisciplinaryRecord(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const r = await prisma.disciplinaryRecord.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/hr/movements");
  revalidatePath(`/africs/hr/employees/${r.employeeId}`);
  return { success: true };
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export async function getMovementStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { promotions: 0, demotions: 0, transfers: 0, disciplinary: 0 };

  const [movementGroups, disciplinaryCount] = await Promise.all([
    prisma.staffMovement.groupBy({
      by: ["movementType"],
      where: { tenantId: owner.id },
      _count: true,
    }),
    prisma.disciplinaryRecord.count({ where: { tenantId: owner.id, status: { in: ["pending", "acknowledged"] } } }),
  ]);

  const byType: Record<string, number> = {};
  for (const g of movementGroups) byType[g.movementType] = g._count;

  return {
    promotions: byType.promotion ?? 0,
    demotions: byType.demotion ?? 0,
    transfers: (byType.department_transfer ?? 0) + (byType.lateral ?? 0) + (byType.role_change ?? 0),
    disciplinary: disciplinaryCount,
  };
}
