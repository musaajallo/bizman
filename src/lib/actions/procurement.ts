"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "./tenants";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

async function generateRequisitionNumber(tenantId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const settings = await tx.procurementSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
    await tx.procurementSettings.update({
      where: { tenantId },
      data: { nextRequisitionNumber: { increment: 1 } },
    });
    return `${settings.requisitionPrefix}-${String(settings.nextRequisitionNumber).padStart(4, "0")}`;
  });
}

async function generatePoNumber(tenantId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const settings = await tx.procurementSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
    await tx.procurementSettings.update({
      where: { tenantId },
      data: { nextPoNumber: { increment: 1 } },
    });
    return `${settings.poPrefix}-${String(settings.nextPoNumber).padStart(4, "0")}`;
  });
}

function serializeReq(r: {
  id: string; tenantId: string; requisitionNumber: string; title: string;
  description: string | null; requestedById: string; department: string | null;
  priority: string; status: string; requiredByDate: Date | null; notes: string | null;
  reviewedById: string | null; reviewNote: string | null; reviewedAt: Date | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...r,
    requiredByDate: r.requiredByDate?.toISOString() ?? null,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializePo(p: {
  id: string; tenantId: string; vendorId: string; requisitionId: string | null;
  poNumber: string; title: string; description: string | null; currency: string;
  subtotal: unknown; taxRate: unknown; taxAmount: unknown; totalAmount: unknown;
  status: string; issueDate: Date; expectedDelivery: Date | null;
  receivedDate: Date | null; billId: string | null; notes: string | null;
  createdById: string; createdAt: Date; updatedAt: Date;
}) {
  return {
    ...p,
    subtotal: toNum(p.subtotal),
    taxRate: toNum(p.taxRate),
    taxAmount: toNum(p.taxAmount),
    totalAmount: toNum(p.totalAmount),
    issueDate: p.issueDate.toISOString(),
    expectedDelivery: p.expectedDelivery?.toISOString() ?? null,
    receivedDate: p.receivedDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ── Requisitions ──────────────────────────────────────────────────────────────

export async function getRequisitions(filters?: { status?: string; priority?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;

  const reqs = await prisma.purchaseRequisition.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true, purchaseOrders: true } },
    },
  });
  return reqs.map((r) => ({ ...serializeReq(r), requestedBy: r.requestedBy, _count: r._count }));
}

export async function getRequisition(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const req = await prisma.purchaseRequisition.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      items: { orderBy: { order: "asc" } },
      purchaseOrders: {
        select: { id: true, poNumber: true, status: true, totalAmount: true, vendor: { select: { name: true } } },
      },
    },
  });
  if (!req) return null;

  return {
    ...serializeReq(req),
    requestedBy: req.requestedBy,
    reviewedBy: req.reviewedBy,
    items: req.items.map((i) => ({
      ...i,
      quantity: toNum(i.quantity),
      estimatedUnitPrice: toNum(i.estimatedUnitPrice),
      estimatedTotal: toNum(i.estimatedTotal),
    })),
    purchaseOrders: req.purchaseOrders.map((p) => ({ ...p, totalAmount: toNum(p.totalAmount) })),
  };
}

export async function getRequisitionStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { draft: 0, pending_approval: 0, approved: 0, total: 0 };

  const counts = await prisma.purchaseRequisition.groupBy({
    by: ["status"],
    where: { tenantId: owner.id },
    _count: true,
  });
  const map = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  return {
    draft: map.draft ?? 0,
    pending_approval: map.pending_approval ?? 0,
    approved: map.approved ?? 0,
    total: counts.reduce((s, c) => s + c._count, 0),
  };
}

export async function createRequisition(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const itemsRaw = formData.get("items") as string;
  const items: { description: string; quantity: number; unit?: string; estimatedUnitPrice?: number }[] =
    itemsRaw ? JSON.parse(itemsRaw) : [];

  const requisitionNumber = await generateRequisitionNumber(owner.id);

  const req = await prisma.purchaseRequisition.create({
    data: {
      tenantId: owner.id,
      requisitionNumber,
      title,
      description: (formData.get("description") as string)?.trim() || null,
      requestedById: session.user.id,
      department: (formData.get("department") as string)?.trim() || null,
      priority: (formData.get("priority") as string) || "normal",
      requiredByDate: formData.get("requiredByDate") ? new Date(formData.get("requiredByDate") as string) : null,
      notes: (formData.get("notes") as string)?.trim() || null,
      items: {
        create: items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || null,
          estimatedUnitPrice: item.estimatedUnitPrice ?? null,
          estimatedTotal: item.estimatedUnitPrice ? item.quantity * item.estimatedUnitPrice : null,
          order: idx,
        })),
      },
    },
  });

  revalidatePath("/africs/accounting/procurement");
  return { success: true, id: req.id };
}

export async function updateRequisition(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const req = await prisma.purchaseRequisition.findFirst({ where: { id, tenantId: owner.id } });
  if (!req) return { error: "Not found" };
  if (req.status !== "draft") return { error: "Only draft requisitions can be edited" };

  const itemsRaw = formData.get("items") as string;
  const items: { description: string; quantity: number; unit?: string; estimatedUnitPrice?: number }[] =
    itemsRaw ? JSON.parse(itemsRaw) : [];

  await prisma.$transaction(async (tx) => {
    await tx.purchaseRequisitionItem.deleteMany({ where: { requisitionId: id } });
    await tx.purchaseRequisition.update({
      where: { id },
      data: {
        title: (formData.get("title") as string)?.trim(),
        description: (formData.get("description") as string)?.trim() || null,
        department: (formData.get("department") as string)?.trim() || null,
        priority: (formData.get("priority") as string) || "normal",
        requiredByDate: formData.get("requiredByDate") ? new Date(formData.get("requiredByDate") as string) : null,
        notes: (formData.get("notes") as string)?.trim() || null,
        items: {
          create: items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || null,
            estimatedUnitPrice: item.estimatedUnitPrice ?? null,
            estimatedTotal: item.estimatedUnitPrice ? item.quantity * item.estimatedUnitPrice : null,
            order: idx,
          })),
        },
      },
    });
  });

  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/requisitions/${id}`);
  return { success: true };
}

export async function submitRequisition(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const req = await prisma.purchaseRequisition.findFirst({ where: { id, tenantId: owner.id } });
  if (!req) return { error: "Not found" };
  if (req.status !== "draft") return { error: "Only draft requisitions can be submitted" };

  await prisma.purchaseRequisition.update({ where: { id }, data: { status: "pending_approval" } });
  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/requisitions/${id}`);
  return { success: true };
}

export async function reviewRequisition(id: string, action: "approved" | "rejected", note?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const req = await prisma.purchaseRequisition.findFirst({ where: { id, tenantId: owner.id } });
  if (!req) return { error: "Not found" };
  if (req.status !== "pending_approval") return { error: "Only pending requisitions can be reviewed" };

  await prisma.purchaseRequisition.update({
    where: { id },
    data: {
      status: action,
      reviewedById: session.user.id,
      reviewNote: note ?? null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/requisitions/${id}`);
  return { success: true };
}

export async function cancelRequisition(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.purchaseRequisition.updateMany({
    where: { id, tenantId: owner.id, status: { in: ["draft", "pending_approval", "approved"] } },
    data: { status: "cancelled" },
  });

  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/requisitions/${id}`);
  return { success: true };
}

// ── Purchase Orders ───────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: { status?: string; vendorId?: string }) {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const where: Record<string, unknown> = { tenantId: owner.id };
  if (filters?.status) where.status = filters.status;
  if (filters?.vendorId) where.vendorId = filters.vendorId;

  const orders = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { id: true, name: true } },
      requisition: { select: { id: true, requisitionNumber: true } },
      _count: { select: { items: true, goodsReceipts: true } },
    },
  });

  return orders.map((p) => ({ ...serializePo(p), vendor: p.vendor, requisition: p.requisition, _count: p._count }));
}

export async function getPurchaseOrder(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: owner.id },
    include: {
      vendor: true,
      requisition: { select: { id: true, requisitionNumber: true, title: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: { order: "asc" },
        include: { goodsReceiptItems: { select: { quantityReceived: true } } },
      },
      goodsReceipts: {
        orderBy: { receivedDate: "desc" },
        include: { receivedBy: { select: { name: true } }, items: true },
      },
      bill: { select: { id: true, billNumber: true, status: true } },
    },
  });
  if (!po) return null;

  return {
    ...serializePo(po),
    vendor: po.vendor,
    requisition: po.requisition,
    createdBy: po.createdBy,
    bill: po.bill,
    items: po.items.map((i) => ({
      ...i,
      quantity: toNum(i.quantity),
      unitPrice: toNum(i.unitPrice),
      totalPrice: toNum(i.totalPrice),
      quantityReceived: toNum(i.quantityReceived),
    })),
    goodsReceipts: po.goodsReceipts.map((gr) => ({
      ...gr,
      receivedDate: gr.receivedDate.toISOString(),
      createdAt: gr.createdAt.toISOString(),
      items: gr.items.map((i) => ({ ...i, quantityReceived: toNum(i.quantityReceived) })),
    })),
  };
}

export async function getProcurementStats() {
  const owner = await getOwnerBusiness();
  if (!owner) return { openPos: 0, pendingReqs: 0, awaitingReceipt: 0, totalPoValue: 0 };

  const [openPos, pendingReqs, awaitingReceipt, valueAgg] = await Promise.all([
    prisma.purchaseOrder.count({ where: { tenantId: owner.id, status: { in: ["draft", "sent", "partially_received"] } } }),
    prisma.purchaseRequisition.count({ where: { tenantId: owner.id, status: "pending_approval" } }),
    prisma.purchaseOrder.count({ where: { tenantId: owner.id, status: { in: ["sent", "partially_received"] } } }),
    prisma.purchaseOrder.aggregate({
      where: { tenantId: owner.id, status: { not: "cancelled" } },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    openPos,
    pendingReqs,
    awaitingReceipt,
    totalPoValue: toNum(valueAgg._sum.totalAmount),
  };
}

export async function createPurchaseOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const vendorId = formData.get("vendorId") as string;
  const title = (formData.get("title") as string)?.trim();
  if (!vendorId || !title) return { error: "Vendor and title are required" };

  const itemsRaw = formData.get("items") as string;
  const items: { description: string; quantity: number; unit?: string; unitPrice: number; categoryId?: string | null }[] =
    itemsRaw ? JSON.parse(itemsRaw) : [];
  if (items.length === 0) return { error: "At least one line item is required" };

  const taxRate = formData.get("taxRate") ? parseFloat(formData.get("taxRate") as string) : null;
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;
  const totalAmount = subtotal + taxAmount;
  const poNumber = await generatePoNumber(owner.id);

  const po = await prisma.purchaseOrder.create({
    data: {
      tenantId: owner.id,
      vendorId,
      requisitionId: (formData.get("requisitionId") as string) || null,
      poNumber,
      title,
      description: (formData.get("description") as string)?.trim() || null,
      currency: (formData.get("currency") as string) || "GMD",
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      expectedDelivery: formData.get("expectedDelivery") ? new Date(formData.get("expectedDelivery") as string) : null,
      notes: (formData.get("notes") as string)?.trim() || null,
      createdById: session.user.id,
      items: {
        create: items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || null,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          order: idx,
          categoryId: item.categoryId || null,
        })),
      },
    },
  });

  revalidatePath("/africs/accounting/procurement");
  return { success: true, id: po.id };
}

export async function updatePurchaseOrder(id: string, formData: FormData) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId: owner.id } });
  if (!po) return { error: "Not found" };
  if (po.status !== "draft") return { error: "Only draft orders can be edited" };

  const itemsRaw = formData.get("items") as string;
  const items: { description: string; quantity: number; unit?: string; unitPrice: number; categoryId?: string | null }[] =
    itemsRaw ? JSON.parse(itemsRaw) : [];

  const taxRate = formData.get("taxRate") ? parseFloat(formData.get("taxRate") as string) : null;
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;
  const totalAmount = subtotal + taxAmount;

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    await tx.purchaseOrder.update({
      where: { id },
      data: {
        vendorId: formData.get("vendorId") as string,
        title: (formData.get("title") as string)?.trim(),
        description: (formData.get("description") as string)?.trim() || null,
        currency: (formData.get("currency") as string) || "GMD",
        subtotal, taxRate, taxAmount, totalAmount,
        expectedDelivery: formData.get("expectedDelivery") ? new Date(formData.get("expectedDelivery") as string) : null,
        notes: (formData.get("notes") as string)?.trim() || null,
        items: {
          create: items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || null,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            order: idx,
            categoryId: item.categoryId || null,
          })),
        },
      },
    });
  });

  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/orders/${id}`);
  return { success: true };
}

export async function sendPurchaseOrder(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId: owner.id } });
  if (!po) return { error: "Not found" };
  if (po.status !== "draft") return { error: "Only draft orders can be sent" };

  await prisma.purchaseOrder.update({ where: { id }, data: { status: "sent" } });
  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/orders/${id}`);
  return { success: true };
}

export async function cancelPurchaseOrder(id: string) {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.purchaseOrder.updateMany({
    where: { id, tenantId: owner.id, status: { in: ["draft", "sent"] } },
    data: { status: "cancelled" },
  });
  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/orders/${id}`);
  return { success: true };
}

export async function receiveGoods(
  poId: string,
  items: { poItemId: string; quantityReceived: number; notes?: string }[],
  notes?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, tenantId: owner.id },
    include: { items: true },
  });
  if (!po) return { error: "Not found" };
  if (!["sent", "partially_received"].includes(po.status)) return { error: "Order must be sent before receiving goods" };

  const receiptCount = await prisma.goodsReceipt.count({ where: { purchaseOrderId: poId } });
  const receiptNumber = `GR-${po.poNumber}-${String(receiptCount + 1).padStart(2, "0")}`;

  await prisma.$transaction(async (tx) => {
    const receipt = await tx.goodsReceipt.create({
      data: {
        tenantId: owner.id,
        purchaseOrderId: poId,
        receiptNumber,
        receivedById: session.user!.id!,
        notes: notes ?? null,
        items: {
          create: items.map((i) => ({ poItemId: i.poItemId, quantityReceived: i.quantityReceived, notes: i.notes ?? null })),
        },
      },
    });

    // Update quantityReceived on each PO item
    for (const item of items) {
      await tx.purchaseOrderItem.update({
        where: { id: item.poItemId },
        data: { quantityReceived: { increment: item.quantityReceived } },
      });
    }

    // Determine new PO status
    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
    const allReceived = updatedItems.every((i) => toNum(i.quantityReceived) >= toNum(i.quantity));
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: allReceived ? "received" : "partially_received", receivedDate: allReceived ? new Date() : undefined },
    });

    return receipt;
  });

  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/orders/${poId}`);
  return { success: true };
}

export async function convertPoToBill(poId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, tenantId: owner.id },
    include: { items: true, vendor: { select: { id: true, paymentTerms: true } } },
  });
  if (!po) return { error: "Not found" };
  if (!["received", "partially_received"].includes(po.status)) return { error: "Goods must be received first" };
  if (po.billId) return { error: "A bill has already been created for this order" };

  // Generate bill number
  const billSettings = await prisma.billSettings.upsert({
    where: { tenantId: owner.id },
    create: { tenantId: owner.id },
    update: {},
  });
  await prisma.billSettings.update({ where: { tenantId: owner.id }, data: { nextBillNumber: { increment: 1 } } });
  const billNumber = `${billSettings.billPrefix}-${String(billSettings.nextBillNumber).padStart(4, "0")}`;

  // Determine due date from vendor payment terms
  const termDays: Record<string, number> = { net15: 15, net30: 30, net60: 60, due_on_receipt: 0 };
  const days = termDays[po.vendor.paymentTerms] ?? 30;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);

  const bill = await prisma.$transaction(async (tx) => {
    const newBill = await tx.bill.create({
      data: {
        tenantId: owner.id,
        vendorId: po.vendorId,
        billNumber,
        title: po.title,
        description: `Created from purchase order ${po.poNumber}`,
        currency: po.currency,
        subtotal: po.subtotal,
        taxRate: po.taxRate,
        taxAmount: po.taxAmount,
        totalAmount: po.totalAmount,
        amountDue: po.totalAmount,
        issueDate: new Date(),
        dueDate,
        status: "draft",
      },
    });
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: { billId: newBill.id, status: "billed" },
    });
    return newBill;
  });

  revalidatePath("/africs/accounting/procurement");
  revalidatePath(`/africs/accounting/procurement/orders/${poId}`);
  revalidatePath("/africs/accounting/bills");
  return { success: true, billId: bill.id };
}

export async function convertRequisitionToPo(requisitionId: string, vendorId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  const req = await prisma.purchaseRequisition.findFirst({
    where: { id: requisitionId, tenantId: owner.id },
    include: { items: true },
  });
  if (!req) return { error: "Not found" };
  if (req.status !== "approved") return { error: "Requisition must be approved first" };

  const poNumber = await generatePoNumber(owner.id);
  const items = req.items.map((i) => ({
    description: i.description,
    quantity: toNum(i.quantity),
    unit: i.unit,
    unitPrice: toNum(i.estimatedUnitPrice),
    totalPrice: toNum(i.estimatedTotal),
    order: i.order,
  }));
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);

  const po = await prisma.$transaction(async (tx) => {
    const newPo = await tx.purchaseOrder.create({
      data: {
        tenantId: owner.id,
        vendorId,
        requisitionId,
        poNumber,
        title: req.title,
        description: req.description,
        currency: "GMD",
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        createdById: session.user!.id!,
        items: { create: items },
      },
    });
    await tx.purchaseRequisition.update({ where: { id: requisitionId }, data: { status: "converted" } });
    return newPo;
  });

  revalidatePath("/africs/accounting/procurement");
  return { success: true, poId: po.id };
}
