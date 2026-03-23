"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfTemplate } from "@/components/invoices/invoice-pdf-template";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import React from "react";
import { revalidatePath } from "next/cache";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

async function generateInvoicePdf(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: { select: { name: true, primaryColor: true } },
      lineItems: { orderBy: { order: "asc" } },
    },
  });
  if (!invoice) return null;

  const settings = await getInvoiceSettings(invoice.tenantId);

  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    referenceNumber: invoice.referenceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientPhone: invoice.clientPhone,
    clientAddress: invoice.clientAddress,
    currency: invoice.currency,
    subtotal: Number(invoice.subtotal),
    taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    amountDue: Number(invoice.amountDue),
    notes: invoice.notes,
    terms: invoice.terms,
    status: invoice.status,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      amount: Number(li.amount),
      unit: li.unit,
    })),
  };

  const bankDetails = {
    bankName: settings.bankName,
    bankAccountName: settings.bankAccountName,
    bankAccountNumber: settings.bankAccountNumber,
    bankRoutingNumber: settings.bankRoutingNumber,
    bankSwift: settings.bankSwift,
    bankIban: settings.bankIban,
  };

  const element = React.createElement(InvoicePdfTemplate, {
    invoice: invoiceData,
    ownerName: invoice.tenant.name,
    ownerColor: invoice.tenant.primaryColor ?? undefined,
    bankDetails,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return { buffer, invoice };
}

function buildInvoiceEmailHtml(options: {
  ownerName: string;
  clientName: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  viewUrl: string;
  message?: string;
  isReminder?: boolean;
}) {
  const { ownerName, clientName, invoiceNumber, total, dueDate, viewUrl, message, isReminder } = options;

  const greeting = isReminder
    ? `This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is due.`
    : `Please find attached invoice <strong>${invoiceNumber}</strong> from ${ownerName}.`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isReminder ? "Payment Reminder" : "Invoice"} ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${ownerName}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#27272a;font-size:15px;">Hi ${clientName},</p>
              <p style="margin:0 0 16px;color:#27272a;font-size:15px;">${greeting}</p>

              ${message ? `<p style="margin:0 0 24px;color:#52525b;font-size:14px;white-space:pre-line;">${message}</p>` : ""}

              <!-- Invoice Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Invoice Number</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:600;padding-bottom:8px;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Amount Due</td>
                        <td align="right" style="color:#18181b;font-size:17px;font-weight:700;padding-bottom:8px;">${total}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Due Date</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:600;">${dueDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${viewUrl}" style="display:inline-block;background-color:#4F6EF7;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;">
                      View Invoice
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;text-align:center;">
                The PDF is also attached to this email for your records.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
                Sent by ${ownerName} via AfricsCore
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendInvoiceEmail(
  invoiceId: string,
  data: { to: string; subject?: string; message?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!data.to || !data.to.includes("@")) return { error: "Valid email address is required" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: { select: { name: true, primaryColor: true } },
    },
  });
  if (!invoice) return { error: "Invoice not found" };

  // Generate PDF
  const pdfResult = await generateInvoicePdf(invoiceId);
  if (!pdfResult) return { error: "Failed to generate PDF" };

  const viewUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/view/invoice/${invoice.shareToken}`;

  const subject = data.subject || `Invoice ${invoice.invoiceNumber} from ${invoice.tenant.name}`;

  const html = buildInvoiceEmailHtml({
    ownerName: invoice.tenant.name,
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    total: formatCurrency(Number(invoice.amountDue), invoice.currency),
    dueDate: formatDate(invoice.dueDate),
    viewUrl,
    message: data.message,
  });

  const result = await sendEmail({
    to: data.to,
    subject,
    html,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfResult.buffer,
      },
    ],
  });

  if (!result.success) return { error: result.error || "Failed to send email" };

  // Update invoice status if draft → sent
  const ops = [];
  if (invoice.status === "draft") {
    ops.push(
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "sent", sentAt: new Date() },
      })
    );
  }

  ops.push(
    prisma.invoiceActivity.create({
      data: {
        invoiceId,
        actorId: session.user.id,
        action: "email_sent",
        details: { to: data.to, subject },
      },
    })
  );

  await prisma.$transaction(ops);

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}

export async function sendReminderEmail(invoiceId: string, data?: { to?: string; message?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: { select: { name: true } },
    },
  });
  if (!invoice) return { error: "Invoice not found" };

  if (!["sent", "viewed", "overdue"].includes(invoice.status)) {
    return { error: "Can only send reminders for sent, viewed, or overdue invoices" };
  }

  const recipientEmail = data?.to || invoice.clientEmail;
  if (!recipientEmail) return { error: "No recipient email address" };

  // Generate PDF
  const pdfResult = await generateInvoicePdf(invoiceId);
  if (!pdfResult) return { error: "Failed to generate PDF" };

  const viewUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/view/invoice/${invoice.shareToken}`;

  const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber} from ${invoice.tenant.name}`;

  const html = buildInvoiceEmailHtml({
    ownerName: invoice.tenant.name,
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    total: formatCurrency(Number(invoice.amountDue), invoice.currency),
    dueDate: formatDate(invoice.dueDate),
    viewUrl,
    message: data?.message,
    isReminder: true,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfResult.buffer,
      },
    ],
  });

  if (!result.success) return { error: result.error || "Failed to send reminder" };

  await prisma.invoiceActivity.create({
    data: {
      invoiceId,
      actorId: session.user.id,
      action: "reminder_sent",
      details: { to: recipientEmail },
    },
  });

  revalidatePath("/africs/accounting/invoices");
  return { success: true };
}
