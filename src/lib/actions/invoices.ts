"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

// --- Queries ---

export async function getInvoices(tenantId: string, filters?: {
  status?: string;
  type?: string;
  projectId?: string;
  clientTenantId?: string;
}) {
  const where: Record<string, unknown> = { tenantId };
  if (filters?.type) {
    where.type = filters.type;
  } else {
    where.type = { not: "credit_note" };
  }
  if (filters?.status) where.status = filters.status;
  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.clientTenantId) where.clientTenantId = filters.clientTenantId;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, slug: true } },
      clientTenant: { select: { id: true, name: true, slug: true } },
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxRate: inv.taxRate ? Number(inv.taxRate) : null,
    taxAmount: Number(inv.taxAmount),
    discountPercent: inv.discountPercent ? Number(inv.discountPercent) : null,
    discountAmount: Number(inv.discountAmount),
    rushFeePercent: inv.rushFeePercent ? Number(inv.rushFeePercent) : null,
    rushFee: Number(inv.rushFee),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    amountDue: Number(inv.amountDue),
  }));
}

export async function getReceipts(tenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId, status: "paid" },
    include: {
      project: { select: { name: true } },
      payments: { orderBy: { date: "desc" } },
    },
    orderBy: { paidDate: "desc" },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName,
    clientEmail: inv.clientEmail,
    currency: inv.currency,
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    paidDate: inv.paidDate,
    projectName: inv.project?.name ?? null,
    payments: inv.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference,
      date: p.date,
    })),
  }));
}

export async function getInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      project: { select: { id: true, name: true, slug: true, billingType: true, hourlyRate: true, budgetAmount: true, budgetCurrency: true } },
      clientTenant: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true } },
      lineItems: { orderBy: { order: "asc" } },
      payments: {
        include: { recordedBy: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
      },
      activities: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      creditNoteFor: { select: { id: true, invoiceNumber: true } },
      creditNotes: { select: { id: true, invoiceNumber: true, status: true, total: true, currency: true, createdAt: true } },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
    taxAmount: Number(invoice.taxAmount),
    discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : null,
    discountAmount: Number(invoice.discountAmount),
    rushFeePercent: invoice.rushFeePercent ? Number(invoice.rushFeePercent) : null,
    rushFee: Number(invoice.rushFee),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    amountDue: Number(invoice.amountDue),
    lineItems: invoice.lineItems.map((li) => ({
      ...li,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      amount: Number(li.amount),
    })),
    project: invoice.project ? {
      ...invoice.project,
      hourlyRate: invoice.project.hourlyRate ? Number(invoice.project.hourlyRate) : null,
      budgetAmount: invoice.project.budgetAmount ? Number(invoice.project.budgetAmount) : null,
    } : null,
    payments: invoice.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    activities: invoice.activities,
    creditNoteFor: invoice.creditNoteFor,
    creditNotes: invoice.creditNotes.map((cn) => ({ ...cn, total: Number(cn.total) })),
  };
}

export async function getInvoicesForProject(projectId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { projectId },
    include: {
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxRate: inv.taxRate ? Number(inv.taxRate) : null,
    taxAmount: Number(inv.taxAmount),
    discountPercent: inv.discountPercent ? Number(inv.discountPercent) : null,
    discountAmount: Number(inv.discountAmount),
    rushFeePercent: inv.rushFeePercent ? Number(inv.rushFeePercent) : null,
    rushFee: Number(inv.rushFee),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    amountDue: Number(inv.amountDue),
  }));
}

export async function getInvoicesForClient(clientTenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { clientTenantId },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxRate: inv.taxRate ? Number(inv.taxRate) : null,
    taxAmount: Number(inv.taxAmount),
    discountPercent: inv.discountPercent ? Number(inv.discountPercent) : null,
    discountAmount: Number(inv.discountAmount),
    rushFeePercent: inv.rushFeePercent ? Number(inv.rushFeePercent) : null,
    rushFee: Number(inv.rushFee),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    amountDue: Number(inv.amountDue),
  }));
}

// --- Auto-number ---

async function generateInvoiceNumber(tenantId: string, type: string = "standard"): Promise<string> {
  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId } });

  let prefix: string;
  let nextNumber: number;
  let updateField: Record<string, unknown>;

  if (type === "proforma") {
    prefix = settings?.proformaPrefix || "PRO";
    nextNumber = settings?.proformaNextNumber || 1;
    updateField = { proformaNextNumber: nextNumber + 1 };
  } else if (type === "credit_note") {
    prefix = settings?.creditNotePrefix || "CN";
    nextNumber = settings?.creditNoteNextNumber || 1;
    updateField = { creditNoteNextNumber: nextNumber + 1 };
  } else {
    prefix = settings?.prefix || "INV";
    nextNumber = settings?.nextNumber || 1;
    updateField = { nextNumber: nextNumber + 1 };
  }

  const invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  await prisma.invoiceSettings.upsert({
    where: { tenantId },
    update: updateField,
    create: { tenantId, ...updateField },
  });

  return invoiceNumber;
}

// --- Create ---

export async function createInvoice(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const tenantId = formData.get("tenantId") as string;
  if (!tenantId) return { error: "Tenant ID is required" };

  const clientName = formData.get("clientName") as string;
  if (!clientName) return { error: "Client name is required" };

  const invoiceType = (formData.get("type") as string) || "standard";
  const invoiceNumber = await generateInvoiceNumber(tenantId, invoiceType);

  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId } });
  const defaultDueDays = settings?.defaultDueDays || 30;

  const issueDateStr = formData.get("issueDate") as string;
  const issueDate = issueDateStr ? new Date(issueDateStr) : new Date();
  const dueDateStr = formData.get("dueDate") as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : new Date(issueDate.getTime() + defaultDueDays * 86400000);

  const taxRateStr = formData.get("taxRate") as string | null;
  const taxRate = taxRateStr ? parseFloat(taxRateStr) : (settings?.defaultTaxRate ? Number(settings.defaultTaxRate) : null);
  const discountPercentStr = formData.get("discountPercent") as string | null;
  const discountPercent = discountPercentStr ? parseFloat(discountPercentStr) : null;
  const rushFeePercentStr = formData.get("rushFeePercent") as string | null;
  const rushFeePercent = rushFeePercentStr ? parseFloat(rushFeePercentStr) : null;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber,
      type: invoiceType,
      projectId: (formData.get("projectId") as string) || null,
      clientTenantId: (formData.get("clientTenantId") as string) || null,
      clientName,
      clientEmail: (formData.get("clientEmail") as string) || null,
      clientPhone: (formData.get("clientPhone") as string) || null,
      clientAddress: (formData.get("clientAddress") as string) || null,
      issueDate,
      dueDate,
      currency: (formData.get("currency") as string) || "USD",
      taxRate,
      discountPercent,
      rushFeePercent,
      notes: (formData.get("notes") as string) || settings?.defaultNotes || null,
      terms: (formData.get("terms") as string) || settings?.defaultTerms || null,
      referenceNumber: (formData.get("referenceNumber") as string) || null,
      creditNoteForId: (formData.get("creditNoteForId") as string) || null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true, invoiceId: invoice.id };
}

export async function createInvoiceFromProject(projectId: string, type: string = "standard") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      clientTenant: { select: { id: true, name: true, primaryContactEmail: true, primaryContactName: true } },
    },
  });
  if (!project) return { error: "Project not found" };

  const invoiceNumber = await generateInvoiceNumber(project.tenantId, type);
  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId: project.tenantId } });
  const defaultDueDays = settings?.defaultDueDays || 30;
  const taxRate = settings?.defaultTaxRate ? Number(settings.defaultTaxRate) : null;

  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + defaultDueDays * 86400000);

  // Snapshot client info
  const clientName = project.clientTenant?.name || project.contactName || "Unknown Client";
  const clientEmail = project.clientTenant?.primaryContactEmail || project.contactEmail || null;

  let lineItems: { description: string; quantity: number; unitPrice: number; amount: number; unit: string; order: number; timeEntryIds: string[] }[] = [];

  if (project.billingType === "hourly" && project.hourlyRate) {
    // Aggregate uninvoiced time entries by user
    const existingInvoiceLineItems = await prisma.invoiceLineItem.findMany({
      where: { invoice: { projectId } },
      select: { timeEntryIds: true },
    });
    const invoicedEntryIds = new Set(existingInvoiceLineItems.flatMap((li) => li.timeEntryIds));

    const timeEntries = await prisma.timeEntry.findMany({
      where: { task: { projectId } },
      include: { user: { select: { name: true } }, task: { select: { title: true } } },
      orderBy: { date: "asc" },
    });

    const uninvoiced = timeEntries.filter((te) => !invoicedEntryIds.has(te.id));

    // Group by user
    const byUser: Record<string, { name: string; minutes: number; entryIds: string[] }> = {};
    for (const entry of uninvoiced) {
      const uid = entry.userId;
      if (!byUser[uid]) {
        byUser[uid] = { name: entry.user.name ?? "Team Member", minutes: 0, entryIds: [] };
      }
      byUser[uid].minutes += entry.minutes;
      byUser[uid].entryIds.push(entry.id);
    }

    const rate = Number(project.hourlyRate);
    let order = 0;
    for (const [, data] of Object.entries(byUser)) {
      const hours = Math.round((data.minutes / 60) * 100) / 100;
      lineItems.push({
        description: `${data.name} — ${project.name}`,
        quantity: hours,
        unitPrice: rate,
        amount: Math.round(hours * rate * 100) / 100,
        unit: "hours",
        order: order++,
        timeEntryIds: data.entryIds,
      });
    }
  } else if (project.billingType === "fixed" && project.budgetAmount) {
    lineItems = [{
      description: `${project.name} — Fixed Fee`,
      quantity: 1,
      unitPrice: Number(project.budgetAmount),
      amount: Number(project.budgetAmount),
      unit: "fixed",
      order: 0,
      timeEntryIds: [],
    }];
  } else if (project.billingType === "retainer" && project.budgetAmount) {
    lineItems = [{
      description: `${project.name} — Monthly Retainer`,
      quantity: 1,
      unitPrice: Number(project.budgetAmount),
      amount: Number(project.budgetAmount),
      unit: "fixed",
      order: 0,
      timeEntryIds: [],
    }];
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const taxAmount = taxRate ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
  const total = subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: project.tenantId,
      invoiceNumber,
      type,
      projectId,
      clientTenantId: project.clientTenantId,
      clientName,
      clientEmail,
      issueDate,
      dueDate,
      currency: project.budgetCurrency || "USD",
      taxRate,
      subtotal,
      taxAmount,
      total,
      amountDue: total,
      notes: settings?.defaultNotes || null,
      terms: settings?.defaultTerms || null,
      createdById: session.user.id,
      lineItems: {
        create: lineItems,
      },
    },
  });

  revalidatePath("/africs/accounting/invoices");
  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, invoiceId: invoice.id };
}

// --- Update ---

export async function updateInvoice(invoiceId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status !== "draft") return { error: "Only draft invoices can be edited" };

  const taxRateStr = formData.get("taxRate") as string | null;
  const discountPercentStr = formData.get("discountPercent") as string | null;
  const rushFeePercentStr = formData.get("rushFeePercent") as string | null;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      clientName: (formData.get("clientName") as string) || undefined,
      clientEmail: (formData.get("clientEmail") as string) || null,
      clientPhone: (formData.get("clientPhone") as string) || null,
      clientAddress: (formData.get("clientAddress") as string) || null,
      issueDate: formData.get("issueDate") ? new Date(formData.get("issueDate") as string) : undefined,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
      currency: (formData.get("currency") as string) || undefined,
      taxRate: taxRateStr ? parseFloat(taxRateStr) : null,
      discountPercent: discountPercentStr ? parseFloat(discountPercentStr) : null,
      rushFeePercent: rushFeePercentStr ? parseFloat(rushFeePercentStr) : null,
      notes: (formData.get("notes") as string) || null,
      terms: (formData.get("terms") as string) || null,
      referenceNumber: (formData.get("referenceNumber") as string) || null,
    },
  });

  await recalculateInvoiceTotals(invoiceId);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

// --- Line Items ---

export async function addLineItem(invoiceId: string, data: {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status !== "draft") return { error: "Only draft invoices can be edited" };

  const lastItem = await prisma.invoiceLineItem.findFirst({
    where: { invoiceId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const amount = Math.round(data.quantity * data.unitPrice * 100) / 100;

  await prisma.invoiceLineItem.create({
    data: {
      invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount,
      unit: data.unit || null,
      order: (lastItem?.order ?? -1) + 1,
    },
  });

  await recalculateInvoiceTotals(invoiceId);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function updateLineItem(lineItemId: string, data: {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  unit?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const item = await prisma.invoiceLineItem.findUnique({
    where: { id: lineItemId },
    include: { invoice: { select: { id: true, status: true } } },
  });
  if (!item) return { error: "Line item not found" };
  if (item.invoice.status !== "draft") return { error: "Only draft invoices can be edited" };

  const quantity = data.quantity ?? Number(item.quantity);
  const unitPrice = data.unitPrice ?? Number(item.unitPrice);
  const amount = Math.round(quantity * unitPrice * 100) / 100;

  await prisma.invoiceLineItem.update({
    where: { id: lineItemId },
    data: {
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount,
      unit: data.unit,
    },
  });

  await recalculateInvoiceTotals(item.invoice.id);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function deleteLineItem(lineItemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const item = await prisma.invoiceLineItem.findUnique({
    where: { id: lineItemId },
    include: { invoice: { select: { id: true, status: true } } },
  });
  if (!item) return { error: "Line item not found" };
  if (item.invoice.status !== "draft") return { error: "Only draft invoices can be edited" };

  await prisma.invoiceLineItem.delete({ where: { id: lineItemId } });
  await recalculateInvoiceTotals(item.invoice.id);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

// --- Totals ---

export async function recalculateInvoiceTotals(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true },
  });
  if (!invoice) return;

  const subtotal = invoice.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
  const taxRate = invoice.taxRate ? Number(invoice.taxRate) : 0;
  const discountPercent = invoice.discountPercent ? Number(invoice.discountPercent) : null;
  const rushFeePercent = invoice.rushFeePercent ? Number(invoice.rushFeePercent) : null;
  const discountAmount = discountPercent != null
    ? Math.round(subtotal * (discountPercent / 100) * 100) / 100
    : Number(invoice.discountAmount) || 0;
  const rushFee = rushFeePercent != null
    ? Math.round(subtotal * (rushFeePercent / 100) * 100) / 100
    : 0;
  const taxAmount = Math.round((subtotal + rushFee - discountAmount) * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + rushFee - discountAmount + taxAmount) * 100) / 100;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const amountDue = Math.round((total - amountPaid) * 100) / 100;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, taxAmount, discountAmount, rushFee, total, amountDue },
  });
}

// --- Delete / Duplicate ---

export async function deleteInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status !== "draft") return { error: "Only draft invoices can be deleted" };

  await prisma.invoice.delete({ where: { id: invoiceId } });

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function duplicateInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const original = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: { orderBy: { order: "asc" } } },
  });
  if (!original) return { error: "Invoice not found" };

  const invoiceNumber = await generateInvoiceNumber(original.tenantId, original.type);
  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId: original.tenantId } });
  const defaultDueDays = settings?.defaultDueDays || 30;

  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + defaultDueDays * 86400000);

  const newInvoice = await prisma.invoice.create({
    data: {
      tenantId: original.tenantId,
      invoiceNumber,
      type: original.type,
      projectId: original.projectId,
      clientTenantId: original.clientTenantId,
      clientName: original.clientName,
      clientEmail: original.clientEmail,
      clientPhone: original.clientPhone,
      clientAddress: original.clientAddress,
      issueDate,
      dueDate,
      currency: original.currency,
      taxRate: original.taxRate ? Number(original.taxRate) : null,
      subtotal: Number(original.subtotal),
      taxAmount: Number(original.taxAmount),
      discountPercent: original.discountPercent ? Number(original.discountPercent) : null,
      discountAmount: Number(original.discountAmount),
      rushFeePercent: original.rushFeePercent ? Number(original.rushFeePercent) : null,
      rushFee: Number(original.rushFee),
      total: Number(original.total),
      amountDue: Number(original.total),
      notes: original.notes,
      terms: original.terms,
      createdById: session.user.id,
      lineItems: {
        create: original.lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          amount: Number(li.amount),
          unit: li.unit,
          order: li.order,
        })),
      },
    },
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true, invoiceId: newInvoice.id };
}

// --- Lifecycle ---

export async function sendInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status !== "draft" && invoice.status !== "sent") return { error: "Invoice cannot be sent in current status" };

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "sent", sentAt: new Date() },
    }),
    prisma.invoiceActivity.create({
      data: { invoiceId, actorId: session.user.id, action: "sent" },
    }),
  ]);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function markInvoiceViewed(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true, viewedAt: true },
  });
  if (!invoice) return { error: "Invoice not found" };

  // Only update if not already viewed and in sent status
  if (invoice.status === "sent" && !invoice.viewedAt) {
    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "viewed", viewedAt: new Date() },
      }),
      prisma.invoiceActivity.create({
        data: { invoiceId, action: "viewed" },
      }),
    ]);
  }

  return { success: true };
}

export async function voidInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "void") return { error: "Invoice is already void" };
  if (invoice.status === "paid") return { error: "Cannot void a paid invoice" };

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "void", voidedAt: new Date() },
    }),
    prisma.invoiceActivity.create({
      data: { invoiceId, actorId: session.user.id, action: "voided" },
    }),
  ]);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function sendReminder(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: { select: { name: true } } },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status !== "sent" && invoice.status !== "viewed" && invoice.status !== "overdue") {
    return { error: "Can only send reminders for sent, viewed, or overdue invoices" };
  }

  if (invoice.clientEmail) {
    const viewUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/view/invoice/${invoice.shareToken}`;
    await sendEmail({
      to: invoice.clientEmail,
      subject: `Payment reminder: ${invoice.invoiceNumber} — ${invoice.tenant.name}`,
      html: buildReminderEmail({
        ownerName: invoice.tenant.name,
        clientName: invoice.clientName,
        invoiceNumber: invoice.invoiceNumber,
        amountDue: Number(invoice.amountDue),
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        viewUrl,
      }),
    });
  }

  await prisma.invoiceActivity.create({
    data: { invoiceId, actorId: session.user.id, action: "reminder_sent" },
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

// Called by cron — sends reminders for all overdue invoices not reminded in last 7 days
export async function sendAllOverdueReminders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const overdue = await prisma.invoice.findMany({
    where: {
      status: "overdue",
      clientEmail: { not: null },
      type: "standard",
    },
    include: {
      tenant: { select: { name: true } },
      activities: {
        where: { action: "reminder_sent", createdAt: { gte: sevenDaysAgo } },
        select: { id: true },
        take: 1,
      },
    },
  });

  let sent = 0;
  for (const invoice of overdue) {
    if (invoice.activities.length > 0) continue; // already reminded recently

    const viewUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/view/invoice/${invoice.shareToken}`;
    const result = await sendEmail({
      to: invoice.clientEmail!,
      subject: `Overdue payment: ${invoice.invoiceNumber} — ${invoice.tenant.name}`,
      html: buildReminderEmail({
        ownerName: invoice.tenant.name,
        clientName: invoice.clientName,
        invoiceNumber: invoice.invoiceNumber,
        amountDue: Number(invoice.amountDue),
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        viewUrl,
        isOverdue: true,
      }),
    });

    if (result.success) {
      await prisma.invoiceActivity.create({
        data: { invoiceId: invoice.id, action: "reminder_sent" },
      });
      sent++;
    }
  }

  return { sent, total: overdue.length };
}

function buildReminderEmail(opts: {
  ownerName: string;
  clientName: string;
  invoiceNumber: string;
  amountDue: number;
  currency: string;
  dueDate: Date;
  viewUrl: string;
  isOverdue?: boolean;
}): string {
  const { ownerName, clientName, invoiceNumber, amountDue, currency, dueDate, viewUrl, isOverdue } = opts;
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountDue);
  const due = new Date(dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const subject = isOverdue ? "overdue" : "due";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#4F6EF7;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${ownerName}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#18181b;">Hi ${clientName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
            This is a reminder that invoice <strong>${invoiceNumber}</strong> for
            <strong>${amount}</strong> is ${subject} on <strong>${due}</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:6px;width:100%;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Amount ${subject}</p>
              <p style="margin:0;font-size:28px;font-weight:700;color:${isOverdue ? "#ef4444" : "#18181b"};">${amount}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Due date: ${due}</p>
            </td></tr>
          </table>
          <a href="${viewUrl}" style="display:inline-block;background:#4F6EF7;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">
            View Invoice &amp; Pay
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
            If you have already made payment, please disregard this message. Contact ${ownerName} if you have any questions.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #e4e4e7;padding:16px 32px;">
          <p style="margin:0;font-size:11px;color:#a1a1aa;">Sent by ${ownerName} via AfricsCore</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// --- Payments ---

export async function recordPayment(invoiceId: string, data: {
  amount: number;
  method?: string;
  reference?: string;
  notes?: string;
  date?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (data.amount <= 0) return { error: "Payment amount must be positive" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true, total: true, amountPaid: true, amountDue: true },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "void" || invoice.status === "draft") {
    return { error: "Cannot record payment for draft or void invoices" };
  }

  const currentPaid = Number(invoice.amountPaid);
  const total = Number(invoice.total);
  const newPaid = Math.round((currentPaid + data.amount) * 100) / 100;
  const newDue = Math.round((total - newPaid) * 100) / 100;
  const fullyPaid = newDue <= 0;

  await prisma.$transaction([
    prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method || null,
        reference: data.reference || null,
        notes: data.notes || null,
        date: data.date ? new Date(data.date) : new Date(),
        recordedById: session.user.id,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newPaid,
        amountDue: Math.max(0, newDue),
        status: fullyPaid ? "paid" : invoice.status,
        paidDate: fullyPaid ? new Date() : undefined,
      },
    }),
    prisma.invoiceActivity.create({
      data: {
        invoiceId,
        actorId: session.user.id,
        action: fullyPaid ? "paid" : "partially_paid",
        details: { amount: data.amount, method: data.method },
      },
    }),
  ]);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function deletePayment(paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await prisma.invoicePayment.findUnique({
    where: { id: paymentId },
    include: { invoice: { select: { id: true, total: true, amountPaid: true, status: true } } },
  });
  if (!payment) return { error: "Payment not found" };

  const newPaid = Math.round((Number(payment.invoice.amountPaid) - Number(payment.amount)) * 100) / 100;
  const newDue = Math.round((Number(payment.invoice.total) - Math.max(0, newPaid)) * 100) / 100;

  // Revert status if was paid
  let newStatus = payment.invoice.status;
  if (payment.invoice.status === "paid") {
    newStatus = newPaid > 0 ? "sent" : "sent";
  }

  await prisma.$transaction([
    prisma.invoicePayment.delete({ where: { id: paymentId } }),
    prisma.invoice.update({
      where: { id: payment.invoice.id },
      data: {
        amountPaid: Math.max(0, newPaid),
        amountDue: newDue,
        status: newStatus,
        paidDate: newStatus === "paid" ? undefined : null,
      },
    }),
    prisma.invoiceActivity.create({
      data: {
        invoiceId: payment.invoice.id,
        actorId: session.user.id,
        action: "payment_deleted",
        details: { amount: Number(payment.amount), method: payment.method },
      },
    }),
  ]);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function getInvoicePayments(invoiceId: string) {
  const payments = await prisma.invoicePayment.findMany({
    where: { invoiceId },
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
  }));
}

export async function getAllPayments(tenantId: string) {
  const payments = await prisma.invoicePayment.findMany({
    where: { invoice: { tenantId } },
    include: {
      recordedBy: { select: { id: true, name: true } },
      invoice: { select: { id: true, invoiceNumber: true, clientName: true, currency: true } },
    },
    orderBy: { date: "desc" },
  });

  return payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
  }));
}

// --- Activities ---

export async function getInvoiceActivities(invoiceId: string) {
  return prisma.invoiceActivity.findMany({
    where: { invoiceId },
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// --- Public access ---

export async function getInvoiceByToken(shareToken: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { shareToken },
    include: {
      tenant: { select: { name: true, logoUrl: true, primaryColor: true, accentColor: true } },
      lineItems: { orderBy: { order: "asc" } },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
    taxAmount: Number(invoice.taxAmount),
    discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : null,
    discountAmount: Number(invoice.discountAmount),
    rushFeePercent: invoice.rushFeePercent ? Number(invoice.rushFeePercent) : null,
    rushFee: Number(invoice.rushFee),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    amountDue: Number(invoice.amountDue),
    lineItems: invoice.lineItems.map((li) => ({
      ...li,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      amount: Number(li.amount),
    })),
  };
}

// --- Overdue check ---

// --- Recurring ---

export async function setRecurring(invoiceId: string, data: {
  isRecurring: boolean;
  interval?: string;
  nextDate?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });
  if (!invoice) return { error: "Invoice not found" };

  if (data.isRecurring && !data.interval) return { error: "Interval is required for recurring invoices" };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      isRecurring: data.isRecurring,
      recurringInterval: data.isRecurring ? data.interval : null,
      nextRecurringDate: data.isRecurring && data.nextDate ? new Date(data.nextDate) : null,
    },
  });

  if (data.isRecurring) {
    await prisma.invoiceActivity.create({
      data: {
        invoiceId,
        actorId: session.user.id,
        action: "recurring_set",
        details: { interval: data.interval },
      },
    });
  }

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

function addInterval(date: Date, interval: string): Date {
  const d = new Date(date);
  switch (interval) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function generateNextRecurringInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const original = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: { orderBy: { order: "asc" } } },
  });
  if (!original) return { error: "Invoice not found" };
  if (!original.isRecurring) return { error: "Invoice is not set as recurring" };

  const invoiceNumber = await generateInvoiceNumber(original.tenantId, original.type);
  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId: original.tenantId } });
  const defaultDueDays = settings?.defaultDueDays || 30;

  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + defaultDueDays * 86400000);

  const newInvoice = await prisma.invoice.create({
    data: {
      tenantId: original.tenantId,
      invoiceNumber,
      type: original.type,
      projectId: original.projectId,
      clientTenantId: original.clientTenantId,
      clientName: original.clientName,
      clientEmail: original.clientEmail,
      clientPhone: original.clientPhone,
      clientAddress: original.clientAddress,
      issueDate,
      dueDate,
      currency: original.currency,
      taxRate: original.taxRate ? Number(original.taxRate) : null,
      subtotal: Number(original.subtotal),
      taxAmount: Number(original.taxAmount),
      discountPercent: original.discountPercent ? Number(original.discountPercent) : null,
      discountAmount: Number(original.discountAmount),
      rushFeePercent: original.rushFeePercent ? Number(original.rushFeePercent) : null,
      rushFee: Number(original.rushFee),
      total: Number(original.total),
      amountDue: Number(original.total),
      notes: original.notes,
      terms: original.terms,
      parentInvoiceId: original.id,
      createdById: session.user.id,
      lineItems: {
        create: original.lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          amount: Number(li.amount),
          unit: li.unit,
          order: li.order,
        })),
      },
    },
  });

  // Advance the next recurring date on the template
  const nextDate = addInterval(
    original.nextRecurringDate || new Date(),
    original.recurringInterval || "monthly"
  );
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { nextRecurringDate: nextDate },
  });

  await prisma.invoiceActivity.create({
    data: {
      invoiceId: newInvoice.id,
      actorId: session.user.id,
      action: "created",
      details: { fromRecurring: original.invoiceNumber },
    },
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true, invoiceId: newInvoice.id };
}

export async function processRecurringInvoices(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const now = new Date();
  const dueTemplates = await prisma.invoice.findMany({
    where: {
      tenantId,
      isRecurring: true,
      nextRecurringDate: { lte: now },
    },
    select: { id: true },
  });

  let generated = 0;
  for (const template of dueTemplates) {
    const result = await generateNextRecurringInvoice(template.id);
    if (result.success) generated++;
  }

  return { success: true, generated };
}

// Called by cron route — no session required, auth is via CRON_SECRET at the HTTP layer
export async function checkAllTenantsOverdueInvoices() {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: { status: { in: ["sent", "viewed"] }, dueDate: { lt: now } },
    data: { status: "overdue" },
  });
  return { marked: result.count };
}

// Called by cron route — no session required, auth is via CRON_SECRET at the HTTP layer
export async function processAllTenantsRecurringInvoices() {
  const now = new Date();
  const dueTemplates = await prisma.invoice.findMany({
    where: { isRecurring: true, nextRecurringDate: { lte: now } },
    select: { id: true, tenantId: true },
  });

  let generated = 0;
  for (const template of dueTemplates) {
    const result = await generateNextRecurringInvoice(template.id);
    if (result.success) generated++;
  }

  return { generated, processed: dueTemplates.length };
}

export async function getRecurringInvoices(tenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId, isRecurring: true },
    include: {
      clientTenant: { select: { id: true, name: true, slug: true } },
      _count: { select: { recurringChildren: true } },
    },
    orderBy: { nextRecurringDate: "asc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxRate: inv.taxRate ? Number(inv.taxRate) : null,
    taxAmount: Number(inv.taxAmount),
    discountPercent: inv.discountPercent ? Number(inv.discountPercent) : null,
    discountAmount: Number(inv.discountAmount),
    rushFeePercent: inv.rushFeePercent ? Number(inv.rushFeePercent) : null,
    rushFee: Number(inv.rushFee),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    amountDue: Number(inv.amountDue),
  }));
}

// --- Dashboard ---

export async function getInvoiceDashboard(tenantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // All non-void invoices
  const invoices = await prisma.invoice.findMany({
    where: { tenantId, status: { not: "void" } },
    select: {
      id: true,
      status: true,
      total: true,
      amountDue: true,
      amountPaid: true,
      currency: true,
      dueDate: true,
      issueDate: true,
      clientName: true,
      clientTenantId: true,
    },
  });

  // Outstanding = sent + viewed + overdue
  const outstanding = invoices
    .filter((i) => ["sent", "viewed", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.amountDue), 0);

  // Overdue
  const overdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.amountDue), 0);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  // Paid this month
  const paidThisMonth = invoices
    .filter((i) => i.status === "paid" && i.issueDate >= startOfMonth)
    .reduce((sum, i) => sum + Number(i.total), 0);

  // Paid this year
  const paidThisYear = invoices
    .filter((i) => i.status === "paid" && i.issueDate >= startOfYear)
    .reduce((sum, i) => sum + Number(i.total), 0);

  // Total invoiced
  const totalInvoiced = invoices
    .filter((i) => i.status !== "draft")
    .reduce((sum, i) => sum + Number(i.total), 0);

  // Draft count
  const draftCount = invoices.filter((i) => i.status === "draft").length;

  // Revenue by month (last 12 months)
  const monthlyRevenue: { month: string; invoiced: number; paid: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const monthInvoiced = invoices
      .filter((inv) => inv.status !== "draft" && inv.issueDate >= d && inv.issueDate <= monthEnd)
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const monthPaid = invoices
      .filter((inv) => inv.status === "paid" && inv.issueDate >= d && inv.issueDate <= monthEnd)
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    monthlyRevenue.push({ month: label, invoiced: monthInvoiced, paid: monthPaid });
  }

  // Top clients by revenue
  const clientMap: Record<string, { name: string; total: number; count: number }> = {};
  for (const inv of invoices.filter((i) => i.status !== "draft")) {
    const key = inv.clientTenantId || inv.clientName;
    if (!clientMap[key]) clientMap[key] = { name: inv.clientName, total: 0, count: 0 };
    clientMap[key].total += Number(inv.total);
    clientMap[key].count++;
  }
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Aging report
  const agingBuckets = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
  for (const inv of invoices.filter((i) => ["sent", "viewed", "overdue"].includes(i.status))) {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
    const amount = Number(inv.amountDue);
    if (daysOverdue <= 0) agingBuckets.current += amount;
    else if (daysOverdue <= 30) agingBuckets.days1to30 += amount;
    else if (daysOverdue <= 60) agingBuckets.days31to60 += amount;
    else if (daysOverdue <= 90) agingBuckets.days61to90 += amount;
    else agingBuckets.days90plus += amount;
  }

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const inv of invoices) {
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
  }

  return {
    outstanding,
    overdue,
    overdueCount,
    paidThisMonth,
    paidThisYear,
    totalInvoiced,
    draftCount,
    totalCount: invoices.length,
    monthlyRevenue,
    topClients,
    agingBuckets,
    statusCounts,
  };
}

// --- Overdue check ---

export async function checkOverdueInvoices(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const now = new Date();
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ["sent", "viewed"] },
      dueDate: { lt: now },
    },
    select: { id: true },
  });

  if (overdueInvoices.length === 0) return { success: true, count: 0 };

  await prisma.$transaction(
    overdueInvoices.map((inv) =>
      prisma.invoice.update({
        where: { id: inv.id },
        data: { status: "overdue" },
      })
    )
  );

  return { success: true, count: overdueInvoices.length };
}

// --- Proforma Actions ---

export async function acceptProforma(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.type !== "proforma") return { error: "Only proforma invoices can be accepted" };
  if (!["sent", "viewed"].includes(invoice.status)) return { error: "Proforma must be sent or viewed to accept" };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "accepted" },
  });

  await prisma.invoiceActivity.create({
    data: {
      invoiceId,
      actorId: session.user.id,
      action: "accepted",
      details: { previousStatus: invoice.status },
    },
  });

  revalidatePath("/africs/accounting/invoices");
  revalidatePath(`/africs/accounting/invoices/${invoiceId}`);
  return { success: true };
}

export async function expireProforma(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.type !== "proforma") return { error: "Only proforma invoices can be expired" };
  if (["expired", "converted", "void"].includes(invoice.status)) return { error: "Proforma is already in a terminal state" };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "expired" },
  });

  await prisma.invoiceActivity.create({
    data: {
      invoiceId,
      actorId: session.user.id,
      action: "expired",
    },
  });

  revalidatePath("/africs/accounting/invoices");
  revalidatePath(`/africs/accounting/invoices/${invoiceId}`);
  return { success: true };
}

export async function convertProformaToInvoice(proformaId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const proforma = await prisma.invoice.findUnique({
    where: { id: proformaId },
    include: { lineItems: { orderBy: { order: "asc" } } },
  });
  if (!proforma) return { error: "Proforma not found" };
  if (proforma.type !== "proforma") return { error: "Only proforma invoices can be converted" };
  if (!["sent", "viewed", "accepted"].includes(proforma.status)) {
    return { error: "Proforma must be sent, viewed, or accepted to convert" };
  }

  const invoiceNumber = await generateInvoiceNumber(proforma.tenantId, "standard");
  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId: proforma.tenantId } });
  const defaultDueDays = settings?.defaultDueDays || 30;

  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + defaultDueDays * 86400000);

  const newInvoice = await prisma.invoice.create({
    data: {
      tenantId: proforma.tenantId,
      invoiceNumber,
      type: "standard",
      projectId: proforma.projectId,
      clientTenantId: proforma.clientTenantId,
      clientName: proforma.clientName,
      clientEmail: proforma.clientEmail,
      clientPhone: proforma.clientPhone,
      clientAddress: proforma.clientAddress,
      issueDate,
      dueDate,
      currency: proforma.currency,
      taxRate: proforma.taxRate ? Number(proforma.taxRate) : null,
      subtotal: Number(proforma.subtotal),
      taxAmount: Number(proforma.taxAmount),
      discountPercent: proforma.discountPercent ? Number(proforma.discountPercent) : null,
      discountAmount: Number(proforma.discountAmount),
      rushFeePercent: proforma.rushFeePercent ? Number(proforma.rushFeePercent) : null,
      rushFee: Number(proforma.rushFee),
      total: Number(proforma.total),
      amountDue: Number(proforma.total),
      notes: proforma.notes,
      terms: proforma.terms,
      convertedFromId: proformaId,
      createdById: session.user.id,
      lineItems: {
        create: proforma.lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          amount: Number(li.amount),
          unit: li.unit,
          order: li.order,
        })),
      },
    },
  });

  // Mark proforma as converted
  await prisma.invoice.update({
    where: { id: proformaId },
    data: { status: "converted" },
  });

  // Log activity on both
  await prisma.invoiceActivity.createMany({
    data: [
      {
        invoiceId: proformaId,
        actorId: session.user.id,
        action: "converted",
        details: { convertedToInvoiceId: newInvoice.id, convertedToNumber: invoiceNumber },
      },
      {
        invoiceId: newInvoice.id,
        actorId: session.user.id,
        action: "created",
        details: { convertedFromProformaId: proformaId, convertedFromNumber: proforma.invoiceNumber },
      },
    ],
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true, invoiceId: newInvoice.id };
}

// --- Credit Notes ---

export async function getCreditNotes(tenantId: string, filters?: { status?: string }) {
  const where: Record<string, unknown> = { tenantId, type: "credit_note" };
  if (filters?.status) where.status = filters.status;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, slug: true } },
      clientTenant: { select: { id: true, name: true, slug: true } },
      creditNoteFor: { select: { id: true, invoiceNumber: true } },
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxRate: inv.taxRate ? Number(inv.taxRate) : null,
    taxAmount: Number(inv.taxAmount),
    discountPercent: inv.discountPercent ? Number(inv.discountPercent) : null,
    discountAmount: Number(inv.discountAmount),
    rushFeePercent: inv.rushFeePercent ? Number(inv.rushFeePercent) : null,
    rushFee: Number(inv.rushFee),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    amountDue: Number(inv.amountDue),
  }));
}

export async function applyCreditNote(creditNoteId: string, targetInvoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const creditNote = await prisma.invoice.findUnique({
    where: { id: creditNoteId },
    select: { type: true, status: true, total: true, invoiceNumber: true },
  });
  if (!creditNote) return { error: "Credit note not found" };
  if (creditNote.type !== "credit_note") return { error: "Not a credit note" };
  if (creditNote.status === "applied" || creditNote.status === "void") {
    return { error: "Credit note has already been applied or voided" };
  }

  const targetInvoice = await prisma.invoice.findUnique({
    where: { id: targetInvoiceId },
    select: { status: true, total: true, amountPaid: true },
  });
  if (!targetInvoice) return { error: "Invoice not found" };
  if (["void", "paid", "draft"].includes(targetInvoice.status)) {
    return { error: "Cannot apply credit to a draft, paid, or void invoice" };
  }

  const creditAmount = Number(creditNote.total);
  const newPaid = Math.round((Number(targetInvoice.amountPaid) + creditAmount) * 100) / 100;
  const newDue = Math.max(0, Math.round((Number(targetInvoice.total) - newPaid) * 100) / 100);
  const fullyPaid = newDue <= 0;

  await prisma.$transaction([
    prisma.invoicePayment.create({
      data: {
        invoiceId: targetInvoiceId,
        creditNoteId,
        amount: creditAmount,
        method: "credit_note",
        reference: creditNote.invoiceNumber,
        notes: `Credit note applied: ${creditNote.invoiceNumber}`,
        date: new Date(),
        recordedById: session.user.id,
      },
    }),
    prisma.invoice.update({
      where: { id: targetInvoiceId },
      data: {
        amountPaid: newPaid,
        amountDue: newDue,
        status: fullyPaid ? "paid" : targetInvoice.status,
        paidDate: fullyPaid ? new Date() : undefined,
      },
    }),
    prisma.invoice.update({
      where: { id: creditNoteId },
      data: { status: "applied" },
    }),
    prisma.invoiceActivity.create({
      data: {
        invoiceId: targetInvoiceId,
        actorId: session.user.id,
        action: "credit_applied",
        details: { creditNoteId, creditNoteNumber: creditNote.invoiceNumber, amount: creditAmount },
      },
    }),
    prisma.invoiceActivity.create({
      data: {
        invoiceId: creditNoteId,
        actorId: session.user.id,
        action: "applied",
        details: { targetInvoiceId },
      },
    }),
  ]);

  revalidatePath("/africs/accounting/invoices");
  revalidatePath("/africs/accounting/credit-notes");
  return { success: true };
}
