import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsFormWrapper } from "@/components/invoices/settings-form-wrapper";

export default async function TaxSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const settings = await getInvoiceSettings(owner.id);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Invoice — Tax</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Set your default tax label and rate for new invoices.
      </p>

      <SettingsFormWrapper tenantId={owner.id}>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Tax Label</Label>
            <Input name="taxLabel" defaultValue={settings.taxLabel || "Tax"} className="h-9 max-w-xs" />
            <p className="text-[10px] text-muted-foreground mt-1">
              How tax appears on invoices, e.g. &quot;VAT&quot;, &quot;GST&quot;, &quot;Sales Tax&quot;
            </p>
          </div>
          <div>
            <Label className="text-xs">Default Tax Rate (%)</Label>
            <Input
              name="defaultTaxRate"
              type="number"
              defaultValue={settings.defaultTaxRate ?? ""}
              className="h-9 w-28"
              min="0"
              step="0.01"
              placeholder="0"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Applied to new invoices by default. Leave empty for no tax.
            </p>
          </div>
        </div>
      </SettingsFormWrapper>
    </div>
  );
}
