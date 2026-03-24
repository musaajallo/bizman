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
import { InvoiceDetailSidebar } from "@/components/invoices/invoice-detail-sidebar";
import { InvoiceTypeBadge } from "@/components/invoices/invoice-type-badge";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceDetailData } from "@/components/invoices/invoice-detail-data";
import { CreditNoteApplyDialog } from "@/components/invoices/credit-note-apply-dialog";

export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [invoice, settings] = await Promise.all([
    getInvoice(id),
    getInvoiceSettings(owner.id),
  ]);
  if (!invoice || invoice.type !== "credit_note") notFound();

  const cn = invoice as typeof invoice & {
    creditNoteFor: { id: string; invoiceNumber: string } | null;
  };

  return (
    <div>
      <TopBar
        title={invoice.invoiceNumber}
        subtitle={`Credit note for ${invoice.clientName}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/credit-notes">
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
        {/* Type + Status */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <InvoiceTypeBadge type={invoice.type} />
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Linked invoice banner */}
        {cn.creditNoteFor && (
          <div className="max-w-2xl mx-auto mb-6 p-3 text-sm bg-rose-500/5 border border-rose-500/20 rounded-lg flex items-center justify-between">
            <span className="text-muted-foreground">
              Credit note for invoice{" "}
              <Link href={`/africs/accounting/invoices/${cn.creditNoteFor.id}`} className="font-mono font-medium text-foreground hover:underline">
                {cn.creditNoteFor.invoiceNumber}
              </Link>
            </span>
            {invoice.status === "draft" || invoice.status === "sent" ? (
              <CreditNoteApplyDialog
                creditNoteId={invoice.id}
                creditNoteNumber={invoice.invoiceNumber}
                defaultInvoiceId={cn.creditNoteFor.id}
                defaultInvoiceNumber={cn.creditNoteFor.invoiceNumber}
              />
            ) : null}
          </div>
        )}

        {/* Apply button if no linked invoice */}
        {!cn.creditNoteFor && (invoice.status === "draft" || invoice.status === "sent") && (
          <div className="max-w-2xl mx-auto mb-6 flex justify-end">
            <CreditNoteApplyDialog
              creditNoteId={invoice.id}
              creditNoteNumber={invoice.invoiceNumber}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
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
            />
          </div>

          {/* Right — Preview */}
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
