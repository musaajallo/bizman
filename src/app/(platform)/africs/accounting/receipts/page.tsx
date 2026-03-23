import { TopBar } from "@/components/layout/top-bar";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getReceipts } from "@/lib/actions/invoices";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { ReceiptPreview, receiptNumber } from "@/components/invoices/receipt-preview";
import { ScrollText, Download } from "lucide-react";
import Link from "next/link";

export default async function ReceiptsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [receipts, settings] = await Promise.all([
    getReceipts(owner.id),
    getInvoiceSettings(owner.id),
  ]);

  return (
    <div>
      <TopBar
        title="Receipts"
        subtitle={`${receipts.length} payment receipt${receipts.length !== 1 ? "s" : ""}`}
      />

      <div className="p-6">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <ScrollText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No receipts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Receipts are generated automatically when invoices are marked as paid.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="space-y-3">
                <ReceiptPreview
                  invoiceId={receipt.id}
                  invoiceNumber={receipt.invoiceNumber}
                  clientName={receipt.clientName}
                  clientEmail={receipt.clientEmail}
                  currency={receipt.currency}
                  amountPaid={receipt.amountPaid}
                  paidDate={receipt.paidDate}
                  payments={receipt.payments}
                  projectName={receipt.projectName}
                  ownerName={owner.name}
                  accentColor={settings.accentColor ?? owner.accentColor}
                  logoUrl={settings.logoUrl ?? owner.logoUrl}
                />

                {/* Action row */}
                <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
                  <Link
                    href={`/africs/accounting/invoices/${receipt.id}`}
                    className="hover:text-foreground transition-colors"
                  >
                    View invoice →
                  </Link>
                  <a
                    href={`/api/invoices/${receipt.id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    {receiptNumber(receipt.invoiceNumber)}.pdf
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
