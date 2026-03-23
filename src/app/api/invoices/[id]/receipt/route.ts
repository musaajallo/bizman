import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { ReceiptPdfTemplate } from "@/components/invoices/receipt-pdf-template";
import { receiptNumber } from "@/components/invoices/receipt-preview";
import React from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true, primaryColor: true, accentColor: true, logoUrl: true } },
      project: { select: { name: true } },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status !== "paid") {
    return NextResponse.json({ error: "Invoice is not paid" }, { status: 400 });
  }

  const settings = await getInvoiceSettings(invoice.tenantId);

  const element = React.createElement(ReceiptPdfTemplate, {
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    currency: invoice.currency,
    amountPaid: Number(invoice.amountPaid),
    paidDate: invoice.paidDate,
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference,
      date: p.date,
    })),
    projectName: invoice.project?.name ?? null,
    ownerName: invoice.tenant.name,
    ownerColor: settings.accentColor ?? invoice.tenant.accentColor ?? invoice.tenant.primaryColor ?? undefined,
    logoUrl: settings.logoUrl ?? invoice.tenant.logoUrl ?? null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  const rcp = receiptNumber(invoice.invoiceNumber);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${rcp}.pdf"`,
    },
  });
}
