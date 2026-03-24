import { TopBar } from "@/components/layout/top-bar";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getReceipts } from "@/lib/actions/invoices";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { ReceiptsView } from "@/components/invoices/receipts-view";
import { ScrollText } from "lucide-react";

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
          <ReceiptsView
            receipts={receipts}
            ownerName={owner.name}
            accentColor={settings.accentColor ?? owner.accentColor}
            logoUrl={settings.logoUrl ?? owner.logoUrl}
          />
        )}
      </div>
    </div>
  );
}
