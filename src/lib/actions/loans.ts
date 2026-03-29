"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

function toNum(d: unknown): number {
  if (d == null) return 0;
  return Number(d);
}

function serializeLoan(l: {
  id: string; tenantId: string; loanType: string; loanNumber: string;
  employeeId: string | null; borrowerName: string;
  principal: unknown; interestRate: unknown; currency: string;
  repaymentSchedule: string; repaymentAmount: unknown;
  disbursementDate: Date | null; status: string;
  payrollDeduction: boolean; notes: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...l,
    principal: toNum(l.principal),
    interestRate: toNum(l.interestRate),
    repaymentAmount: l.repaymentAmount != null ? toNum(l.repaymentAmount) : null,
    disbursementDate: l.disbursementDate?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

function serializeRepayment(r: {
  id: string; loanId: string; tenantId: string;
  amount: unknown; method: string; paidAt: Date; notes: string | null;
  createdAt: Date;
}) {
  return {
    ...r,
    amount: toNum(r.amount),
    paidAt: r.paidAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export async function getLoans(filters?: { status?: string; loanType?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.loanType) where.loanType = filters.loanType;

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      repayments: { orderBy: { paidAt: "desc" } },
    },
  });

  return loans.map((l) => ({
    ...serializeLoan(l),
    employee: l.employee,
    repayments: l.repayments.map(serializeRepayment),
    amountPaid: l.repayments.reduce((sum, r) => sum + toNum(r.amount), 0),
  }));
}

export async function getLoanById(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const l = await prisma.loan.findUnique({
    where: { id, tenantId: owner.id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      repayments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!l) return null;

  const amountPaid = l.repayments.reduce((sum, r) => sum + toNum(r.amount), 0);

  return {
    ...serializeLoan(l),
    employee: l.employee,
    repayments: l.repayments.map(serializeRepayment),
    amountPaid,
    outstanding: toNum(l.principal) - amountPaid,
  };
}

export async function createLoan(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  // Generate loan number
  const count = await prisma.loan.count({ where: { tenantId: owner.id } });
  const loanNumber = `LN-${String(count + 1).padStart(4, "0")}`;

  const loan = await prisma.loan.create({
    data: {
      tenantId: owner.id,
      loanNumber,
      loanType: formData.get("loanType") as string,
      employeeId: (formData.get("employeeId") as string) || null,
      borrowerName: formData.get("borrowerName") as string,
      principal: parseFloat(formData.get("principal") as string),
      interestRate: formData.get("interestRate") ? parseFloat(formData.get("interestRate") as string) : 0,
      currency: (formData.get("currency") as string) || "GMD",
      repaymentSchedule: (formData.get("repaymentSchedule") as string) || "monthly",
      repaymentAmount: formData.get("repaymentAmount") ? parseFloat(formData.get("repaymentAmount") as string) : null,
      disbursementDate: formData.get("disbursementDate") ? new Date(formData.get("disbursementDate") as string) : null,
      payrollDeduction: formData.get("payrollDeduction") === "true",
      notes: (formData.get("notes") as string) || null,
      status: "approved",
    },
  });

  revalidatePath("/africs/accounting/loans");
  return { id: loan.id };
}

export async function updateLoanStatus(id: string, status: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.loan.update({
    where: { id, tenantId: owner.id },
    data: { status },
  });

  revalidatePath("/africs/accounting/loans");
  revalidatePath(`/africs/accounting/loans/${id}`);
  return { success: true };
}

export async function deleteLoan(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.loan.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/accounting/loans");
  return { success: true };
}

// ── Repayments ────────────────────────────────────────────────────────────────

export async function addRepayment(loanId: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  // Verify loan belongs to this tenant
  const loan = await prisma.loan.findUnique({ where: { id: loanId, tenantId: owner.id } });
  if (!loan) return { error: "Loan not found" };

  const repayment = await prisma.loanRepayment.create({
    data: {
      tenantId: owner.id,
      loanId,
      amount: parseFloat(formData.get("amount") as string),
      method: (formData.get("method") as string) || "bank_transfer",
      paidAt: formData.get("paidAt") ? new Date(formData.get("paidAt") as string) : new Date(),
      notes: (formData.get("notes") as string) || null,
    },
  });

  // Check if fully paid and auto-settle
  const allRepayments = await prisma.loanRepayment.findMany({ where: { loanId } });
  const totalPaid = allRepayments.reduce((sum, r) => sum + toNum(r.amount), 0);
  if (totalPaid >= toNum(loan.principal)) {
    await prisma.loan.update({ where: { id: loanId }, data: { status: "settled" } });
  } else if (loan.status === "approved" || loan.status === "disbursed") {
    await prisma.loan.update({ where: { id: loanId }, data: { status: "active" } });
  }

  revalidatePath(`/africs/accounting/loans/${loanId}`);
  revalidatePath("/africs/accounting/loans");
  return { id: repayment.id };
}

export async function deleteRepayment(id: string, loanId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  await prisma.loanRepayment.delete({ where: { id, tenantId: owner.id } });
  revalidatePath(`/africs/accounting/loans/${loanId}`);
  return { success: true };
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export async function getLoanStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { totalLoans: 0, totalOutstanding: 0, repaymentsThisMonth: 0, overdueCount: 0 };

  const [loans, repaymentsThisMonth] = await Promise.all([
    prisma.loan.findMany({
      where: { tenantId: owner.id, status: { in: ["active", "disbursed", "approved"] } },
      include: { repayments: { select: { amount: true } } },
    }),
    prisma.loanRepayment.aggregate({
      where: {
        tenantId: owner.id,
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalOutstanding = loans.reduce((sum, l) => {
    const paid = l.repayments.reduce((s, r) => s + toNum(r.amount), 0);
    return sum + (toNum(l.principal) - paid);
  }, 0);

  return {
    totalLoans: loans.length,
    totalOutstanding,
    repaymentsThisMonth: toNum(repaymentsThisMonth._sum.amount),
    overdueCount: 0, // can be enhanced later with due date tracking
  };
}
