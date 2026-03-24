"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "./tenants";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

function serializeBillFields(b: {
  id: string; tenantId: string; vendorId: string;
  billNumber: string; referenceNumber: string | null;
  title: string; description: string | null; notes: string | null;
  currency: string; status: string;
  issueDate: Date; dueDate: Date; paidAt?: Date | null;
  createdAt: Date; updatedAt: Date;
  subtotal: unknown; taxRate: unknown; taxAmount: unknown;
  totalAmount: unknown; amountPaid: unknown; amountDue: unknown;
}) {
  return {
    id: b.id,
    tenantId: b.tenantId,
    vendorId: b.vendorId,
    billNumber: b.billNumber,
    referenceNumber: b.referenceNumber,
    title: b.title,
    description: b.description,
    notes: b.notes,
    currency: b.currency,
    status: b.status,
    subtotal: toNum(b.subtotal),
    taxRate: toNum(b.taxRate),
    taxAmount: toNum(b.taxAmount),
    totalAmount: toNum(b.totalAmount),
    amountPaid: toNum(b.amountPaid),
    amountDue: toNum(b.amountDue),
    issueDate: b.issueDate.toISOString(),
    dueDate: b.dueDate.toISOString(),
    paidAt: b.paidAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

async function generateBillNumber(tenantId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const settings = await tx.billSettings.upsert({
      where: { tenantId },
      create: { tenantId, billPrefix: "BILL", nextBillNumber: 1 },
      update: {},
    });
    await tx.billSettings.update({
      where: { tenantId },
      data: { nextBillNumber: { increment: 1 } },
    });
    return `${settings.billPrefix}-${String(settings.nextBillNumber).padStart(4, "0")}`;
  });
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getBills(filters?: { status?: string; vendorId?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.vendorId) where.vendorId = filters.vendorId;

  const bills = await prisma.bill.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { vendor: { select: { id: true, name: true } } },
  });

  return bills.map((b) => ({ ...serializeBillFields(b), vendor: b.vendor }));
}

export async function getBill(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const bill = await prisma.bill.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      vendor: true,
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
  if (!bill) return null;

  return {
    ...serializeBillFields(bill),
    payments: bill.payments.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      billId: p.billId,
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
      amount: toNum(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
    vendor: {
      id: bill.vendor.id,
      name: bill.vendor.name,
      email: bill.vendor.email,
      phone: bill.vendor.phone,
    },
  };
}

export async function getBillStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { outstandingCount: 0, outstandingAmount: 0, overdueCount: 0, overdueAmount: 0, paidThisMonthAmount: 0, activeVendors: 0 };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [outstanding, overdue, paidThisMonth, activeVendors] = await Promise.all([
    prisma.bill.aggregate({
      where: { tenantId: owner.id, status: { in: ["approved", "partially_paid", "overdue"] } },
      _count: true,
      _sum: { amountDue: true },
    }),
    prisma.bill.aggregate({
      where: { tenantId: owner.id, status: "overdue" },
      _count: true,
      _sum: { amountDue: true },
    }),
    prisma.bill.aggregate({
      where: { tenantId: owner.id, status: "paid", paidAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.vendor.count({ where: { tenantId: owner.id, status: "active" } }),
  ]);

  return {
    outstandingCount: outstanding._count,
    outstandingAmount: toNum(outstanding._sum.amountDue),
    overdueCount: overdue._count,
    overdueAmount: toNum(overdue._sum.amountDue),
    paidThisMonthAmount: toNum(paidThisMonth._sum.totalAmount),
    activeVendors,
  };
}

export async function getBillsForVendor(vendorId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const bills = await prisma.bill.findMany({
    where: { vendorId, tenantId: owner.id },
    orderBy: [{ dueDate: "desc" }],
    include: { vendor: { select: { id: true, name: true } } },
  });

  return bills.map((b) => ({ ...serializeBillFields(b), vendor: b.vendor }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createBill(formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const vendorId = formData.get("vendorId") as string;
  const title = (formData.get("title") as string)?.trim();
  const subtotal = parseFloat(formData.get("subtotal") as string);
  const dueDate = formData.get("dueDate") as string;

  if (!vendorId) return { error: "Vendor is required" };
  if (!title) return { error: "Title is required" };
  if (isNaN(subtotal) || subtotal <= 0) return { error: "A valid amount is required" };
  if (!dueDate) return { error: "Due date is required" };

  const taxRate = parseFloat(formData.get("taxRate") as string) || 0;
  const taxAmount = parseFloat(((taxRate / 100) * subtotal).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
  const issueDate = (formData.get("issueDate") as string) || new Date().toISOString().slice(0, 10);
  const currency = (formData.get("currency") as string) || "GMD";

  const billNumber = await generateBillNumber(owner.id);

  const bill = await prisma.bill.create({
    data: {
      tenantId: owner.id,
      vendorId,
      billNumber,
      referenceNumber: (formData.get("referenceNumber") as string) || null,
      title,
      description: (formData.get("description") as string) || null,
      subtotal,
      taxRate: taxRate || null,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      currency,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      notes: (formData.get("notes") as string) || null,
      status: "draft",
    },
  });

  revalidatePath("/africs/accounting/bills");
  return { id: bill.id };
}

export async function updateBill(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const bill = await prisma.bill.findFirst({ where: { id, tenantId: owner.id } });
  if (!bill) return { error: "Not found" };
  if (bill.status !== "draft") return { error: "Only draft bills can be edited" };

  const subtotal = parseFloat(formData.get("subtotal") as string);
  const taxRate = parseFloat(formData.get("taxRate") as string) || 0;
  const taxAmount = parseFloat(((taxRate / 100) * subtotal).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  await prisma.bill.update({
    where: { id },
    data: {
      vendorId: formData.get("vendorId") as string,
      title: (formData.get("title") as string)?.trim(),
      description: (formData.get("description") as string) || null,
      referenceNumber: (formData.get("referenceNumber") as string) || null,
      subtotal,
      taxRate: taxRate || null,
      taxAmount,
      totalAmount,
      amountDue: totalAmount,
      currency: (formData.get("currency") as string) || "GMD",
      issueDate: new Date(formData.get("issueDate") as string),
      dueDate: new Date(formData.get("dueDate") as string),
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/africs/accounting/bills");
  revalidatePath(`/africs/accounting/bills/${id}`);
  return { success: true };
}

export async function approveBill(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const bill = await prisma.bill.findFirst({ where: { id, tenantId: owner.id } });
  if (!bill) return { error: "Not found" };
  if (bill.status !== "draft") return { error: "Only draft bills can be approved" };

  await prisma.bill.update({ where: { id }, data: { status: "approved" } });
  revalidatePath(`/africs/accounting/bills/${id}`);
  revalidatePath("/africs/accounting/bills");
  return { success: true };
}

export async function recordBillPayment(
  id: string,
  data: { amount: number; paymentDate: string; paymentMethod?: string; reference?: string; notes?: string }
) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const bill = await prisma.bill.findFirst({ where: { id, tenantId: owner.id } });
  if (!bill) return { error: "Not found" };
  if (!["approved", "partially_paid", "overdue"].includes(bill.status)) return { error: "Bill is not payable" };

  if (data.amount <= 0) return { error: "Amount must be greater than zero" };
  const currentDue = toNum(bill.amountDue);
  if (data.amount > currentDue + 0.01) return { error: `Amount exceeds the amount due (${currentDue})` };

  await prisma.$transaction(async (tx) => {
    await tx.billPayment.create({
      data: {
        billId: id,
        tenantId: owner.id,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod || null,
        reference: data.reference || null,
        notes: data.notes || null,
      },
    });

    const newPaid = toNum(bill.amountPaid) + data.amount;
    const newDue = parseFloat((toNum(bill.totalAmount) - newPaid).toFixed(2));
    const isPaid = newDue <= 0;

    await tx.bill.update({
      where: { id },
      data: {
        amountPaid: newPaid,
        amountDue: Math.max(0, newDue),
        status: isPaid ? "paid" : "partially_paid",
        paidAt: isPaid ? new Date() : null,
      },
    });
  });

  revalidatePath(`/africs/accounting/bills/${id}`);
  revalidatePath("/africs/accounting/bills");
  return { success: true };
}

export async function deleteBillPayment(paymentId: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const payment = await prisma.billPayment.findFirst({
    where: { id: paymentId, tenantId: owner.id },
    include: { bill: true },
  });
  if (!payment) return { error: "Not found" };

  await prisma.$transaction(async (tx) => {
    await tx.billPayment.delete({ where: { id: paymentId } });

    const newPaid = toNum(payment.bill.amountPaid) - toNum(payment.amount);
    const newDue = parseFloat((toNum(payment.bill.totalAmount) - newPaid).toFixed(2));
    const newStatus = newPaid <= 0 ? "approved" : "partially_paid";

    await tx.bill.update({
      where: { id: payment.billId },
      data: { amountPaid: Math.max(0, newPaid), amountDue: newDue, status: newStatus, paidAt: null },
    });
  });

  revalidatePath(`/africs/accounting/bills/${payment.billId}`);
  revalidatePath("/africs/accounting/bills");
  return { success: true };
}

export async function voidBill(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const bill = await prisma.bill.findFirst({ where: { id, tenantId: owner.id } });
  if (!bill) return { error: "Not found" };
  if (["paid", "void"].includes(bill.status)) return { error: "Cannot void a paid or already voided bill" };

  await prisma.bill.update({ where: { id }, data: { status: "void" } });
  revalidatePath(`/africs/accounting/bills/${id}`);
  revalidatePath("/africs/accounting/bills");
  return { success: true };
}

export async function deleteBill(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "Not found" };

  const bill = await prisma.bill.findFirst({ where: { id, tenantId: owner.id } });
  if (!bill) return { error: "Not found" };
  if (bill.status !== "draft") return { error: "Only draft bills can be deleted" };

  await prisma.bill.delete({ where: { id } });
  revalidatePath("/africs/accounting/bills");
  return { success: true };
}
