import { getInvoiceByToken, markInvoiceViewed } from "@/lib/actions/invoices";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { PublicInvoiceActions } from "@/components/invoices/public-invoice-actions";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);
  if (!invoice) notFound();

  const [settings] = await Promise.all([
    getInvoiceSettings(invoice.tenantId),
    markInvoiceViewed(invoice.id),
  ]);

  const isPaid = invoice.status === "paid";
  const isVoid = invoice.status === "void";
  const isProforma = invoice.type === "proforma";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        {/* Status Banner */}
        {isProforma && !isVoid && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
            <p className="text-amber-400 font-medium">This is a proforma invoice (estimate). It is not a request for payment.</p>
          </div>
        )}
        {isPaid && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
            <p className="text-emerald-400 font-medium">This invoice has been paid. Thank you!</p>
          </div>
        )}
        {isVoid && (
          <div className="mb-6 p-4 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-center">
            <p className="text-zinc-400 font-medium">This invoice has been voided.</p>
          </div>
        )}

        {/* Download PDF button */}
        <div className="mb-6 flex justify-end">
          <PublicInvoiceActions invoiceId={invoice.id} />
        </div>

        {/* Invoice Preview */}
        <InvoicePreview
          invoice={invoice as unknown as Parameters<typeof InvoicePreview>[0]["invoice"]}
          invoiceType={invoice.type}
          ownerName={invoice.tenant.name}
          accentColor={settings.accentColor ?? invoice.tenant.accentColor ?? invoice.tenant.primaryColor}
          logoUrl={settings.logoUrl ?? invoice.tenant.logoUrl}
        />

        {/* Bank Details (if not paid, not proforma) */}
        {!isPaid && !isVoid && !isProforma && invoice.amountDue > 0 && (
          <div className="mt-8 p-6 bg-background border rounded-lg">
            <h3 className="font-medium mb-3">Payment Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please reference invoice <span className="font-mono font-medium">{invoice.invoiceNumber}</span> with your payment.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Contact {invoice.tenant.name} for payment details.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Powered by AfricsCore</p>
        </div>
      </div>
    </div>
  );
}
