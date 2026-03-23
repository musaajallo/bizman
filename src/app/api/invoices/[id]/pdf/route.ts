import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { InvoicePdfTemplate } from "@/components/invoices/invoice-pdf-template";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true, primaryColor: true, accentColor: true, logoUrl: true } },
      lineItems: { orderBy: { order: "asc" } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

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
    ownerColor: settings.accentColor ?? invoice.tenant.accentColor ?? invoice.tenant.primaryColor ?? undefined,
    logoUrl: settings.logoUrl ?? invoice.tenant.logoUrl ?? undefined,
    bankDetails,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
