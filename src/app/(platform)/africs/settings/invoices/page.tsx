import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsFormWrapper } from "@/components/invoices/settings-form-wrapper";

export default async function InvoiceGeneralSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const settings = await getInvoiceSettings(owner.id);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Invoice — General</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Configure invoice numbering and default payment terms.
      </p>

      <SettingsFormWrapper tenantId={owner.id}>
        <div className="space-y-6">
          <div className="border-b pb-6">
            <h3 className="text-sm font-medium mb-4">Invoice Numbering</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Prefix</Label>
                <Input name="prefix" defaultValue={settings.prefix} className="h-9" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Appears before the invoice number, e.g. {settings.prefix}-0001
                </p>
              </div>
              <div>
                <Label className="text-xs">Next Number</Label>
                <Input value={settings.nextNumber} readOnly className="h-9 bg-muted cursor-not-allowed" tabIndex={-1} />
                <p className="text-[10px] text-muted-foreground mt-1">Auto-incremented</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Payment Terms</h3>
            <div>
              <Label className="text-xs">Default Due Days</Label>
              <Input
                name="defaultDueDays"
                type="number"
                defaultValue={settings.defaultDueDays}
                className="h-9 w-28"
                min="1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Days after issue date that invoices are due by default
              </p>
            </div>
          </div>
        </div>
      </SettingsFormWrapper>
    </div>
  );
}
