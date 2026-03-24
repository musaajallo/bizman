import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoice } from "@/lib/actions/invoices";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceDetailActions } from "@/components/invoices/invoice-detail-actions";
import { InvoiceStatusFlow } from "@/components/invoices/invoice-status-flow";
import { InvoiceDetailSidebar } from "@/components/invoices/invoice-detail-sidebar";
import { InvoiceTypeBadge } from "@/components/invoices/invoice-type-badge";
import { InvoiceDetailData } from "@/components/invoices/invoice-detail-data";
import { ReceiptPreview } from "@/components/invoices/receipt-preview";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [invoice, settings] = await Promise.all([
    getInvoice(id),
    getInvoiceSettings(owner.id),
  ]);
  if (!invoice) notFound();

  return (
    <div>
      <TopBar
        title={invoice.invoiceNumber}
        subtitle={`${invoice.type === "proforma" ? "Proforma invoice" : invoice.type === "credit_note" ? "Credit note" : "Invoice"} for ${invoice.clientName}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/invoices">
              <Button size="sm" variant="ghost" className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
            <InvoiceDetailActions
              invoiceId={invoice.id}
              invoiceType={invoice.type}
              status={invoice.status}
              shareToken={invoice.shareToken}
              clientName={invoice.clientName}
              clientEmail={invoice.clientEmail}
              invoiceNumber={invoice.invoiceNumber}
              ownerName={owner.name}
            />
          </div>
        }
      />
      <div className="p-6">
        {/* Type + Status Flow */}
        <div className="max-w-md mx-auto mb-6 space-y-3">
          {invoice.type === "proforma" && (
            <div className="flex justify-center">
              <InvoiceTypeBadge type={invoice.type} />
            </div>
          )}
          <InvoiceStatusFlow status={invoice.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — Invoice Data */}
          <div className="lg:col-span-2 space-y-4">
            {invoice.status === "paid" && (
              <ReceiptPreview
                compact
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                clientName={invoice.clientName}
                clientEmail={invoice.clientEmail}
                currency={invoice.currency}
                amountPaid={invoice.amountPaid}
                paidDate={invoice.paidDate}
                payments={invoice.payments}
                projectName={invoice.project?.name ?? null}
                ownerName={owner.name}
                accentColor={settings.accentColor ?? owner.accentColor}
                logoUrl={settings.logoUrl ?? owner.logoUrl}
              />
            )}
            <InvoiceDetailData invoice={invoice as unknown as Parameters<typeof InvoiceDetailData>[0]["invoice"]} />
            <InvoiceDetailSidebar
              invoiceId={invoice.id}
              invoiceType={invoice.type}
              status={invoice.status}
              amountDue={invoice.amountDue}
              currency={invoice.currency}
              payments={invoice.payments}
              activities={invoice.activities}
              isRecurring={invoice.isRecurring}
              recurringInterval={invoice.recurringInterval}
              nextRecurringDate={invoice.nextRecurringDate}
              creditNotes={(invoice as unknown as { creditNotes: { id: string; invoiceNumber: string; status: string; total: number; currency: string }[] }).creditNotes}
            />
          </div>

          {/* Right — PDF Preview */}
          <div className="lg:col-span-3">
            <InvoicePreview
              invoice={invoice as unknown as Parameters<typeof InvoicePreview>[0]["invoice"]}
              invoiceType={invoice.type}
              ownerName={owner.name}
              accentColor={settings.accentColor ?? owner.accentColor}
              logoUrl={settings.logoUrl ?? owner.logoUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
