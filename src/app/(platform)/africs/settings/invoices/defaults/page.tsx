import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsFormWrapper } from "@/components/invoices/settings-form-wrapper";

export default async function DefaultContentSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const settings = await getInvoiceSettings(owner.id);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Invoice — Default Content</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Default notes and terms pre-filled on every new invoice.
      </p>

      <SettingsFormWrapper tenantId={owner.id}>
        <div className="space-y-6">
          <div>
            <Label className="text-xs">Default Notes</Label>
            <Textarea
              name="defaultNotes"
              defaultValue={settings.defaultNotes || ""}
              rows={4}
              className="text-sm"
              placeholder="Thank you for your business! Payment is due within the stated terms."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Appears in the Notes section of every new invoice
            </p>
          </div>
          <div>
            <Label className="text-xs">Default Terms & Conditions</Label>
            <Textarea
              name="defaultTerms"
              defaultValue={settings.defaultTerms || ""}
              rows={4}
              className="text-sm"
              placeholder="Payment is due within the number of days specified. Late payments may incur additional charges."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Appears in the Terms & Conditions section of every new invoice
            </p>
          </div>
        </div>
      </SettingsFormWrapper>
    </div>
  );
}
