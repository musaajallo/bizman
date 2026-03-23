"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

function pad(n: number) {
  return String(n).padStart(4, "0");
}

async function generateEmployeeNumber(tenantId: string): Promise<string> {
  const last = await prisma.employee.findFirst({
    where: { tenantId },
    orderBy: { employeeNumber: "desc" },
    select: { employeeNumber: true },
  });
  if (!last) return "EMP-0001";
  const match = last.employeeNumber.match(/(\d+)$/);
  const next = match ? parseInt(match[1]) + 1 : 1;
  return `EMP-${pad(next)}`;
}

export async function getEmployees(
  tenantId: string,
  filters?: { status?: string; department?: string; employmentType?: string; search?: string }
) {
  const where: Record<string, unknown> = { tenantId };
  if (filters?.status) where.status = filters.status;
  if (filters?.department) where.department = filters.department;
  if (filters?.employmentType) where.employmentType = filters.employmentType;
  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { employeeNumber: { contains: filters.search, mode: "insensitive" } },
      { jobTitle: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.employee.findMany({
    where,
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: true,
      unit: true,
      employmentType: true,
      status: true,
      photoUrl: true,
      startDate: true,
      personalEmail: true,
      personalPhone: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeNumber: true } },
      directReports: { select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeNumber: true, photoUrl: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
      tenant: { select: { id: true, name: true, logoUrl: true, primaryColor: true, accentColor: true } },
    },
  });
}

export async function getEmployeesForSelect(tenantId: string) {
  return prisma.employee.findMany({
    where: { tenantId, status: { not: "terminated" } },
    select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeNumber: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getEmployeeStats(tenantId: string) {
  const all = await prisma.employee.findMany({
    where: { tenantId },
    select: { status: true, department: true, employmentType: true, startDate: true },
  });

  const byStatus = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  const byDepartment = all.reduce<Record<string, number>>((acc, e) => {
    if (e.department) acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});

  const byType = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.employmentType] = (acc[e.employmentType] || 0) + 1;
    return acc;
  }, {});

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentHires = await prisma.employee.findMany({
    where: { tenantId, startDate: { gte: ninetyDaysAgo } },
    select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, startDate: true, photoUrl: true },
    orderBy: { startDate: "desc" },
    take: 5,
  });

  return {
    total: all.length,
    active: byStatus.active || 0,
    onLeave: byStatus.on_leave || 0,
    suspended: byStatus.suspended || 0,
    terminated: byStatus.terminated || 0,
    byDepartment,
    byType,
    recentHires,
  };
}

export async function createEmployee(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No owner business" };

  const manualNumber = (formData.get("employeeNumber") as string)?.trim();
  const employeeNumber = manualNumber || (await generateEmployeeNumber(owner.id));

  const salary = formData.get("basicSalary") ? parseFloat(formData.get("basicSalary") as string) : null;
  const pension = formData.get("pensionContribution") ? parseFloat(formData.get("pensionContribution") as string) : null;
  const housing = formData.get("housingAllowance") ? parseFloat(formData.get("housingAllowance") as string) : null;
  const transport = formData.get("transportAllowance") ? parseFloat(formData.get("transportAllowance") as string) : null;
  const other = formData.get("otherAllowance") ? parseFloat(formData.get("otherAllowance") as string) : null;

  const employee = await prisma.employee.create({
    data: {
      tenantId: owner.id,
      employeeNumber,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      middleName: (formData.get("middleName") as string) || null,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : null,
      gender: (formData.get("gender") as string) || null,
      nationality: (formData.get("nationality") as string) || null,
      nationalIdNumber: (formData.get("nationalIdNumber") as string) || null,
      photoUrl: (formData.get("photoUrl") as string) || null,
      personalEmail: (formData.get("personalEmail") as string) || null,
      personalPhone: (formData.get("personalPhone") as string) || null,
      homeAddress: (formData.get("homeAddress") as string) || null,
      emergencyContactName: (formData.get("emergencyContactName") as string) || null,
      emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || null,
      emergencyContactRelationship: (formData.get("emergencyContactRelationship") as string) || null,
      jobTitle: (formData.get("jobTitle") as string) || null,
      department: (formData.get("department") as string) || null,
      unit: (formData.get("unit") as string) || null,
      employmentType: (formData.get("employmentType") as string) || "full_time",
      startDate: new Date(formData.get("startDate") as string),
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
      probationEndDate: formData.get("probationEndDate") ? new Date(formData.get("probationEndDate") as string) : null,
      status: (formData.get("status") as string) || "active",
      managerId: (formData.get("managerId") as string) || null,
      basicSalary: salary,
      currency: (formData.get("currency") as string) || "USD",
      payFrequency: (formData.get("payFrequency") as string) || "monthly",
      bankName: (formData.get("bankName") as string) || null,
      bankAccountName: (formData.get("bankAccountName") as string) || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string) || null,
      hasMedicalAid: formData.get("hasMedicalAid") === "true",
      medicalAidProvider: (formData.get("medicalAidProvider") as string) || null,
      medicalAidPlan: (formData.get("medicalAidPlan") as string) || null,
      hasPension: formData.get("hasPension") === "true",
      pensionContribution: pension,
      housingAllowance: housing,
      transportAllowance: transport,
      otherAllowance: other,
      otherAllowanceLabel: (formData.get("otherAllowanceLabel") as string) || null,
      shirtSize: (formData.get("shirtSize") as string) || null,
      trouserSize: (formData.get("trouserSize") as string) || null,
      shoeSize: (formData.get("shoeSize") as string) || null,
      jacketSize: (formData.get("jacketSize") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/hr/employees");
  return { success: true, id: employee.id };
}

export async function updateEmployee(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const salary = formData.get("basicSalary") ? parseFloat(formData.get("basicSalary") as string) : null;
  const pension = formData.get("pensionContribution") ? parseFloat(formData.get("pensionContribution") as string) : null;
  const housing = formData.get("housingAllowance") ? parseFloat(formData.get("housingAllowance") as string) : null;
  const transport = formData.get("transportAllowance") ? parseFloat(formData.get("transportAllowance") as string) : null;
  const other = formData.get("otherAllowance") ? parseFloat(formData.get("otherAllowance") as string) : null;

  await prisma.employee.update({
    where: { id },
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      middleName: (formData.get("middleName") as string) || null,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : null,
      gender: (formData.get("gender") as string) || null,
      nationality: (formData.get("nationality") as string) || null,
      nationalIdNumber: (formData.get("nationalIdNumber") as string) || null,
      photoUrl: (formData.get("photoUrl") as string) || null,
      personalEmail: (formData.get("personalEmail") as string) || null,
      personalPhone: (formData.get("personalPhone") as string) || null,
      homeAddress: (formData.get("homeAddress") as string) || null,
      emergencyContactName: (formData.get("emergencyContactName") as string) || null,
      emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || null,
      emergencyContactRelationship: (formData.get("emergencyContactRelationship") as string) || null,
      jobTitle: (formData.get("jobTitle") as string) || null,
      department: (formData.get("department") as string) || null,
      unit: (formData.get("unit") as string) || null,
      employmentType: (formData.get("employmentType") as string) || "full_time",
      startDate: new Date(formData.get("startDate") as string),
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
      probationEndDate: formData.get("probationEndDate") ? new Date(formData.get("probationEndDate") as string) : null,
      status: (formData.get("status") as string) || "active",
      managerId: (formData.get("managerId") as string) || null,
      basicSalary: salary,
      currency: (formData.get("currency") as string) || "USD",
      payFrequency: (formData.get("payFrequency") as string) || "monthly",
      bankName: (formData.get("bankName") as string) || null,
      bankAccountName: (formData.get("bankAccountName") as string) || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string) || null,
      hasMedicalAid: formData.get("hasMedicalAid") === "true",
      medicalAidProvider: (formData.get("medicalAidProvider") as string) || null,
      medicalAidPlan: (formData.get("medicalAidPlan") as string) || null,
      hasPension: formData.get("hasPension") === "true",
      pensionContribution: pension,
      housingAllowance: housing,
      transportAllowance: transport,
      otherAllowance: other,
      otherAllowanceLabel: (formData.get("otherAllowanceLabel") as string) || null,
      shirtSize: (formData.get("shirtSize") as string) || null,
      trouserSize: (formData.get("trouserSize") as string) || null,
      shoeSize: (formData.get("shoeSize") as string) || null,
      jacketSize: (formData.get("jacketSize") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/hr/employees");
  revalidatePath(`/africs/hr/employees/${id}`);
  return { success: true };
}

export async function updateEmployeeStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.employee.update({ where: { id }, data: { status } });
  revalidatePath("/africs/hr/employees");
  revalidatePath(`/africs/hr/employees/${id}`);
  return { success: true };
}

export async function deleteEmployee(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.employee.delete({ where: { id } });
  revalidatePath("/africs/hr/employees");
  return { success: true };
}

export async function addEmployeeDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const employeeId = formData.get("employeeId") as string;

  await prisma.employeeDocument.create({
    data: {
      employeeId,
      name: formData.get("name") as string,
      fileUrl: formData.get("fileUrl") as string,
      mimeType: (formData.get("mimeType") as string) || null,
      fileSize: formData.get("fileSize") ? parseInt(formData.get("fileSize") as string) : null,
    },
  });

  revalidatePath(`/africs/hr/employees/${employeeId}`);
  return { success: true };
}

export async function deleteEmployeeDocument(id: string, employeeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.employeeDocument.delete({ where: { id } });
  revalidatePath(`/africs/hr/employees/${employeeId}`);
  return { success: true };
}
