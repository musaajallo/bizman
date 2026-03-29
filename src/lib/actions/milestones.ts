"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordActivity } from "./project-activity";
import { generateInvoiceNumber } from "./invoices";

export async function getMilestones(projectId: string) {
  return prisma.milestone.findMany({
    where: { projectId },
    include: {
      payment: {
        include: {
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { order: "asc" },
  });
}

export async function createMilestone(
  projectId: string,
  data: { name: string; description?: string; dueDate?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!data.name.trim()) return { error: "Milestone name is required" };

  const last = await prisma.milestone.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      order: (last?.order ?? -1) + 1,
    },
  });

  await recordActivity(projectId, session.user.id, "created_milestone", {
    milestoneName: milestone.name,
  });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, id: milestone.id };
}

export async function updateMilestone(
  milestoneId: string,
  data: { name?: string; description?: string; dueDate?: string; status?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim() || null;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "completed") {
      updateData.completed = true;
      updateData.completedAt = new Date();
    } else {
      updateData.completed = false;
      updateData.completedAt = null;
    }
  }

  const milestone = await prisma.milestone.update({ where: { id: milestoneId }, data: updateData });

  // Auto-trigger on_completion payment if configured
  if (data.status === "completed") {
    const withPayment = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { payment: true },
    });
    if (
      withPayment?.payment?.triggerType === "on_completion" &&
      !withPayment.payment.invoiceId
    ) {
      await triggerMilestonePayment(milestoneId);
    }
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true, milestone };
}

export async function toggleMilestone(milestoneId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) return { error: "Milestone not found" };

  const completed = !milestone.completed;
  const status = completed ? "completed" : "not_started";
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      completed,
      status,
      completedAt: completed ? new Date() : null,
    },
  });

  if (completed) {
    await recordActivity(milestone.projectId, session.user.id, "completed_milestone", {
      milestoneName: milestone.name,
    });
  }

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteMilestone(milestoneId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.milestone.delete({ where: { id: milestoneId } });

  revalidatePath("/africs/projects");
  revalidatePath("/clients");
  return { success: true };
}

// --- Payment Trigger ---

export async function setMilestonePayment(
  milestoneId: string,
  data: { amount: number; currency: string; description?: string; triggerType?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.milestonePayment.upsert({
    where: { milestoneId },
    update: {
      amount: data.amount,
      currency: data.currency,
      description: data.description?.trim() || null,
      triggerType: data.triggerType || "manual",
    },
    create: {
      milestoneId,
      amount: data.amount,
      currency: data.currency,
      description: data.description?.trim() || null,
      triggerType: data.triggerType || "manual",
    },
  });

  revalidatePath("/africs/projects");
  return { success: true };
}

export async function triggerMilestonePayment(milestoneId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Unauthorized" };

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      payment: { include: { invoice: { select: { id: true, status: true } } } },
      project: {
        include: {
          clientTenant: {
            select: { id: true, name: true, primaryContactEmail: true, primaryContactPhone: true, primaryContactName: true },
          },
        },
      },
    },
  });

  if (!milestone) return { error: "Milestone not found" };
  if (!milestone.payment) return { error: "No payment configured for this milestone" };

  // Idempotency guard: already has an active invoice
  if (
    milestone.payment.invoiceId &&
    milestone.payment.invoice?.status !== "void"
  ) {
    return { error: "Invoice already triggered for this milestone" };
  }

  const project = milestone.project;
  const payment = milestone.payment;

  const settings = await prisma.invoiceSettings.findUnique({
    where: { tenantId: project.tenantId },
  });
  const defaultDueDays = settings?.defaultDueDays || 30;
  const taxRate = settings?.defaultTaxRate ? Number(settings.defaultTaxRate) : null;

  const invoiceNumber = await generateInvoiceNumber(project.tenantId, "standard");
  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + defaultDueDays * 86400000);

  const clientName =
    project.clientTenant?.name ?? project.contactName ?? "Unknown Client";
  const clientEmail =
    project.clientTenant?.primaryContactEmail ?? project.contactEmail ?? null;

  const amount = Number(payment.amount);
  const taxAmount = taxRate ? Math.round(amount * (taxRate / 100) * 100) / 100 : 0;
  const total = Math.round((amount + taxAmount) * 100) / 100;

  const lineItemDescription = payment.description?.trim() || milestone.name;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId: project.tenantId,
        invoiceNumber,
        type: "standard",
        projectId: project.id,
        clientTenantId: project.clientTenantId,
        clientName,
        clientEmail,
        issueDate,
        dueDate,
        currency: payment.currency,
        taxRate,
        subtotal: amount,
        taxAmount,
        total,
        amountDue: total,
        referenceNumber: milestone.name,
        notes: settings?.defaultNotes || null,
        terms: settings?.defaultTerms || null,
        createdById: userId,
      },
    });

    await tx.invoiceLineItem.create({
      data: {
        invoiceId: inv.id,
        description: lineItemDescription,
        quantity: 1,
        unitPrice: amount,
        amount,
        unit: "fixed",
        order: 0,
      },
    });

    await tx.milestonePayment.update({
      where: { milestoneId },
      data: {
        invoiceId: inv.id,
        triggeredAt: new Date(),
        triggeredById: userId,
      },
    });

    return inv;
  });

  await recordActivity(project.id, userId, "triggered_milestone_payment", {
    milestoneName: milestone.name,
    invoiceNumber,
  });

  revalidatePath("/africs/projects");
  revalidatePath("/africs/accounting/invoices");
  revalidatePath("/clients");

  return { success: true, invoiceId: invoice.id, invoiceNumber };
}
