import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsFormWrapper } from "@/components/invoices/settings-form-wrapper";

export default async function BankSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const settings = await getInvoiceSettings(owner.id);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Invoice — Bank Details</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Bank information shown on invoices and PDF downloads for payment.
      </p>

      <SettingsFormWrapper tenantId={owner.id}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Bank Name</Label>
              <Input name="bankName" defaultValue={settings.bankName || ""} className="h-9" placeholder="e.g. Chase, Barclays" />
            </div>
            <div>
              <Label className="text-xs">Account Name</Label>
              <Input name="bankAccountName" defaultValue={settings.bankAccountName || ""} className="h-9" placeholder="Account holder name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Account Number</Label>
              <Input name="bankAccountNumber" defaultValue={settings.bankAccountNumber || ""} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Routing Number</Label>
              <Input name="bankRoutingNumber" defaultValue={settings.bankRoutingNumber || ""} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">SWIFT / BIC</Label>
              <Input name="bankSwift" defaultValue={settings.bankSwift || ""} className="h-9" placeholder="For international transfers" />
            </div>
            <div>
              <Label className="text-xs">IBAN</Label>
              <Input name="bankIban" defaultValue={settings.bankIban || ""} className="h-9" />
            </div>
          </div>
        </div>
      </SettingsFormWrapper>
    </div>
  );
}
