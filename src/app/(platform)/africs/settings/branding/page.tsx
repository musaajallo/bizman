import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { BrandingSettingsForm } from "@/components/settings/branding-settings-form";

export default async function BrandingSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-lg font-semibold">Branding</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Define your logo, colors, and visual identity — applied across the platform and all generated documents.
      </p>

      <BrandingSettingsForm tenant={owner} />
    </div>
  );
}
