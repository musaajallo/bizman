"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";
import { getApprovedOvertimeForPayroll } from "./overtime";
import { postJournalEntry } from "@/lib/actions/accounting/journal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

function buildPeriodLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getPayrollRuns(filters?: { status?: string; year?: number }) {
  const owner = await getOwnerBusiness();
  if (!owner) throw new Error("Not found");

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.year) where.periodYear = filters.year;

  const runs = await prisma.payrollRun.findMany({
    where,
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    include: { _count: { select: { payslips: true } } },
  });

  return runs.map((r) => ({
    ...r,
    totalGross: toNum(r.totalGross),
    totalDeductions: toNum(r.totalDeductions),
    totalNet: toNum(r.totalNet),
  }));
}

export async function getPayrollRun(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const run = await prisma.payrollRun.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      payslips: {
        include: {
          employee: { select: { id: true, photoUrl: true, status: true } },
        },
        orderBy: { employeeName: "asc" },
      },
    },
  });

  if (!run) return null;

  return {
    ...run,
    totalGross: toNum(run.totalGross),
    totalDeductions: toNum(run.totalDeductions),
    totalNet: toNum(run.totalNet),
    payslips: run.payslips.map((p) => ({
      ...p,
      basicSalary: toNum(p.basicSalary),
      housingAllowance: toNum(p.housingAllowance),
      transportAllowance: toNum(p.transportAllowance),
      otherAllowance: toNum(p.otherAllowance),
      overtimeHours: toNum(p.overtimeHours),
      overtimeRate: toNum(p.overtimeRate),
      overtimePay: toNum(p.overtimePay),
      grossPay: toNum(p.grossPay),
      pensionRate: toNum(p.pensionRate),
      pensionContribution: toNum(p.pensionContribution),
      medicalAidDeduction: toNum(p.medicalAidDeduction),
      payeTax: toNum(p.payeTax),
      otherDeduction: toNum(p.otherDeduction),
      totalDeductions: toNum(p.totalDeductions),
      netPay: toNum(p.netPay),
    })),
  };
}

export async function getPayslip(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const p = await prisma.payslip.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      payrollRun: true,
      employee: { select: { id: true, photoUrl: true, personalEmail: true, personalPhone: true } },
      tenant: { select: { name: true, logoUrl: true, primaryColor: true, accentColor: true, address: true } },
    },
  });

  if (!p) return null;

  return {
    ...p,
    basicSalary: toNum(p.basicSalary),
    housingAllowance: toNum(p.housingAllowance),
    transportAllowance: toNum(p.transportAllowance),
    otherAllowance: toNum(p.otherAllowance),
    overtimeHours: toNum(p.overtimeHours),
    overtimeRate: toNum(p.overtimeRate),
    overtimePay: toNum(p.overtimePay),
    grossPay: toNum(p.grossPay),
    pensionRate: toNum(p.pensionRate),
    pensionContribution: toNum(p.pensionContribution),
    medicalAidDeduction: toNum(p.medicalAidDeduction),
    payeTax: toNum(p.payeTax),
    otherDeduction: toNum(p.otherDeduction),
    totalDeductions: toNum(p.totalDeductions),
    netPay: toNum(p.netPay),
    payrollRun: {
      ...p.payrollRun,
      totalGross: toNum(p.payrollRun.totalGross),
      totalDeductions: toNum(p.payrollRun.totalDeductions),
      totalNet: toNum(p.payrollRun.totalNet),
    },
  };
}

export async function getPayslipsForEmployee(employeeId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const payslips = await prisma.payslip.findMany({
    where: { employeeId, tenantId: owner.id },
    include: { payrollRun: { select: { periodLabel: true, periodMonth: true, periodYear: true, status: true } } },
    orderBy: [{ payrollRun: { periodYear: "desc" } }, { payrollRun: { periodMonth: "desc" } }],
  });

  return payslips.map((p) => ({
    ...p,
    grossPay: toNum(p.grossPay),
    totalDeductions: toNum(p.totalDeductions),
    netPay: toNum(p.netPay),
    basicSalary: toNum(p.basicSalary),
    pensionRate: toNum(p.pensionRate),
    pensionContribution: toNum(p.pensionContribution),
    medicalAidDeduction: toNum(p.medicalAidDeduction),
    payeTax: toNum(p.payeTax),
    otherDeduction: toNum(p.otherDeduction),
    housingAllowance: toNum(p.housingAllowance),
    transportAllowance: toNum(p.transportAllowance),
    otherAllowance: toNum(p.otherAllowance),
    overtimeHours: toNum(p.overtimeHours),
    overtimeRate: toNum(p.overtimeRate),
    overtimePay: toNum(p.overtimePay),
  }));
}

export async function getPayrollStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { totalRuns: 0, totalPaid: 0, latestRun: null };

  const year = new Date().getFullYear();

  const [totalRuns, totalPaid, latestRun] = await Promise.all([
    prisma.payrollRun.count({ where: { tenantId: owner.id, periodYear: year } }),
    prisma.payrollRun.count({ where: { tenantId: owner.id, periodYear: year, status: "paid" } }),
    prisma.payrollRun.findFirst({
      where: { tenantId: owner.id },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      select: { id: true, periodLabel: true, status: true, totalNet: true, employeeCount: true, currency: true },
    }),
  ]);

  return {
    totalRuns,
    totalPaid,
    latestRun: latestRun
      ? { ...latestRun, totalNet: toNum(latestRun.totalNet) }
      : null,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createPayrollRun(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const periodMonth = parseInt(formData.get("periodMonth") as string);
  const periodYear = parseInt(formData.get("periodYear") as string);
  const currency = (formData.get("currency") as string) || "USD";
  const notes = (formData.get("notes") as string) || null;

  if (isNaN(periodMonth) || isNaN(periodYear) || periodMonth < 1 || periodMonth > 12) {
    return { error: "Invalid period" };
  }

  // Check uniqueness
  const existing = await prisma.payrollRun.findUnique({
    where: { tenantId_periodMonth_periodYear: { tenantId: owner.id, periodMonth, periodYear } },
  });
  if (existing) return { error: `A payroll run for ${buildPeriodLabel(periodMonth, periodYear)} already exists` };

  // Fetch all active/on-leave employees
  const employees = await prisma.employee.findMany({
    where: { tenantId: owner.id, status: { in: ["active", "on_leave"] } },
    select: {
      id: true, firstName: true, lastName: true, employeeNumber: true,
      jobTitle: true, department: true,
      basicSalary: true, housingAllowance: true, transportAllowance: true,
      otherAllowance: true, otherAllowanceLabel: true,
      pensionContribution: true, hasMedicalAid: true,
      bankName: true, bankAccountName: true, bankAccountNumber: true,
    },
  });

  if (employees.length === 0) return { error: "No active employees found" };

  // Fetch approved overtime for each employee this period
  const overtimeByEmployee = new Map<string, { totalHours: number; totalPay: number; averageRate: number }>();
  await Promise.all(
    employees.map(async (e) => {
      const ot = await getApprovedOvertimeForPayroll(e.id, periodMonth, periodYear);
      if (ot.totalHours > 0) overtimeByEmployee.set(e.id, ot);
    })
  );

  // Build payslip data for each employee
  const payslipData = employees.map((e) => {
    const basic = toNum(e.basicSalary);
    const housing = toNum(e.housingAllowance);
    const transport = toNum(e.transportAllowance);
    const other = toNum(e.otherAllowance);
    const ot = overtimeByEmployee.get(e.id);
    const overtimeHours = ot?.totalHours ?? 0;
    const overtimeRate = ot?.averageRate ?? 0;
    const overtimePay = ot?.totalPay ?? 0;
    const gross = basic + housing + transport + other + overtimePay;
    const pensionRate = toNum(e.pensionContribution);
    const pension = parseFloat(((pensionRate / 100) * basic).toFixed(2));
    const totalDed = pension;
    const net = parseFloat((gross - totalDed).toFixed(2));

    return {
      employeeId: e.id,
      tenantId: owner.id,
      employeeName: `${e.firstName} ${e.lastName}`,
      employeeNumber: e.employeeNumber,
      jobTitle: e.jobTitle,
      department: e.department,
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      otherAllowance: other,
      otherAllowanceLabel: e.otherAllowanceLabel,
      overtimeHours,
      overtimeRate,
      overtimePay,
      grossPay: gross,
      pensionRate,
      pensionContribution: pension,
      medicalAidDeduction: 0,
      payeTax: 0,
      otherDeduction: 0,
      otherDeductionLabel: null,
      totalDeductions: totalDed,
      netPay: net,
      currency,
      bankName: e.bankName,
      bankAccountName: e.bankAccountName,
      bankAccountNumber: e.bankAccountNumber,
      status: "pending",
    };
  });

  const totalGross = payslipData.reduce((s, p) => s + p.grossPay, 0);
  const totalDeductions = payslipData.reduce((s, p) => s + p.totalDeductions, 0);
  const totalNet = payslipData.reduce((s, p) => s + p.netPay, 0);

  const run = await prisma.$transaction(async (tx) => {
    const payrollRun = await tx.payrollRun.create({
      data: {
        tenantId: owner.id,
        periodMonth,
        periodYear,
        periodLabel: buildPeriodLabel(periodMonth, periodYear),
        currency,
        notes,
        totalGross,
        totalDeductions,
        totalNet,
        employeeCount: employees.length,
      },
    });
    await tx.payslip.createMany({
      data: payslipData.map((p) => ({ ...p, payrollRunId: payrollRun.id })),
    });
    return payrollRun;
  });

  revalidatePath("/africs/accounting/payroll");
  return { success: true, id: run.id };
}

export async function updatePayslip(
  id: string,
  data: {
    basicSalary?: number;
    housingAllowance?: number;
    transportAllowance?: number;
    otherAllowance?: number;
    otherAllowanceLabel?: string | null;
    overtimeHours?: number;
    overtimeRate?: number;
    overtimePay?: number;
    pensionRate?: number;
    medicalAidDeduction?: number;
    payeTax?: number;
    otherDeduction?: number;
    otherDeductionLabel?: string | null;
    notes?: string | null;
  }
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const payslip = await prisma.payslip.findFirst({
    where: { id, tenantId: owner.id },
    include: { payrollRun: { select: { id: true, status: true } } },
  });
  if (!payslip) return { error: "Not found" };
  if (payslip.payrollRun.status !== "draft") return { error: "Cannot edit a processed payroll run" };

  const basic = data.basicSalary ?? toNum(payslip.basicSalary);
  const housing = data.housingAllowance ?? toNum(payslip.housingAllowance);
  const transport = data.transportAllowance ?? toNum(payslip.transportAllowance);
  const other = data.otherAllowance ?? toNum(payslip.otherAllowance);
  const overtimeHours = data.overtimeHours ?? toNum(payslip.overtimeHours);
  const overtimeRate = data.overtimeRate ?? toNum(payslip.overtimeRate);
  const overtimePay = data.overtimePay ?? toNum(payslip.overtimePay);
  const gross = basic + housing + transport + other + overtimePay;

  const pensionRate = data.pensionRate ?? toNum(payslip.pensionRate);
  const pension = parseFloat(((pensionRate / 100) * basic).toFixed(2));
  const medical = data.medicalAidDeduction ?? toNum(payslip.medicalAidDeduction);
  const paye = data.payeTax ?? toNum(payslip.payeTax);
  const otherDed = data.otherDeduction ?? toNum(payslip.otherDeduction);
  const totalDed = parseFloat((pension + medical + paye + otherDed).toFixed(2));
  const net = parseFloat((gross - totalDed).toFixed(2));

  await prisma.$transaction(async (tx) => {
    await tx.payslip.update({
      where: { id },
      data: {
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowance: other,
        otherAllowanceLabel: data.otherAllowanceLabel !== undefined ? data.otherAllowanceLabel : payslip.otherAllowanceLabel,
        overtimeHours,
        overtimeRate,
        overtimePay,
        grossPay: gross,
        pensionRate,
        pensionContribution: pension,
        medicalAidDeduction: medical,
        payeTax: paye,
        otherDeduction: otherDed,
        otherDeductionLabel: data.otherDeductionLabel !== undefined ? data.otherDeductionLabel : payslip.otherDeductionLabel,
        totalDeductions: totalDed,
        netPay: net,
        notes: data.notes !== undefined ? data.notes : payslip.notes,
      },
    });

    // Recalculate run totals
    const agg = await tx.payslip.aggregate({
      where: { payrollRunId: payslip.payrollRunId },
      _sum: { grossPay: true, totalDeductions: true, netPay: true },
    });
    await tx.payrollRun.update({
      where: { id: payslip.payrollRunId },
      data: {
        totalGross: toNum(agg._sum.grossPay),
        totalDeductions: toNum(agg._sum.totalDeductions),
        totalNet: toNum(agg._sum.netPay),
      },
    });
  });

  revalidatePath(`/africs/accounting/payroll/${payslip.payrollRunId}`);
  return { success: true };
}

export async function processPayrollRun(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const run = await prisma.payrollRun.findFirst({ where: { id, tenantId: owner.id } });
  if (!run) return { error: "Not found" };
  if (run.status !== "draft") return { error: "Payroll run is not in draft status" };

  const processedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({ where: { payrollRunId: id }, data: { status: "processed" } });
    await tx.payrollRun.update({ where: { id }, data: { status: "processing", processedAt } });

    const totalNet = toNum(run.totalNet);
    if (totalNet > 0) {
      await postJournalEntry({
        tenantId: owner.id,
        date: processedAt,
        description: `Payroll — ${run.periodLabel}`,
        reference: id,
        sourceType: "payroll_run",
        sourceId: id,
        lines: [
          { accountCode: "6000", debit: totalNet, description: "Salaries & Wages" },
          { accountCode: "2100", credit: totalNet, description: "Wages Payable" },
        ],
        tx,
      });
    }
  });

  revalidatePath(`/africs/accounting/payroll/${id}`);
  revalidatePath("/africs/accounting/payroll");
  return { success: true };
}

export async function markPayrollPaid(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const run = await prisma.payrollRun.findFirst({ where: { id, tenantId: owner.id } });
  if (!run) return { error: "Not found" };
  if (run.status !== "processing") return { error: "Payroll run must be in processing status" };

  const paidAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({ where: { payrollRunId: id }, data: { status: "paid" } });
    await tx.payrollRun.update({ where: { id }, data: { status: "paid", paidAt } });

    const totalNet = toNum(run.totalNet);
    if (totalNet > 0) {
      await postJournalEntry({
        tenantId: owner.id,
        date: paidAt,
        description: `Payroll paid — ${run.periodLabel}`,
        reference: id,
        sourceType: "payroll_payment",
        sourceId: id,
        lines: [
          { accountCode: "2100", debit: totalNet, description: "Wages Payable" },
          { accountCode: "1000", credit: totalNet, description: "Cash/Bank" },
        ],
        tx,
      });
    }
  });

  revalidatePath(`/africs/accounting/payroll/${id}`);
  revalidatePath("/africs/accounting/payroll");
  return { success: true };
}

export async function deletePayrollRun(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const run = await prisma.payrollRun.findFirst({ where: { id, tenantId: owner.id } });
  if (!run) return { error: "Not found" };
  if (run.status !== "draft") return { error: "Only draft payroll runs can be deleted" };

  await prisma.payrollRun.delete({ where: { id } });

  revalidatePath("/africs/accounting/payroll");
  return { success: true };
}
