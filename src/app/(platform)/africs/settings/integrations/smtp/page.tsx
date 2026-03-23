import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getSmtpSettings } from "@/lib/actions/smtp-settings";
import { notFound } from "next/navigation";
import { SmtpSettingsForm } from "@/components/settings/smtp-settings-form";

export default async function SmtpSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const settings = await getSmtpSettings(owner.id);

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-lg font-semibold">SMTP</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Send emails through your own mail server or any SMTP provider — Gmail, Mailgun, Postmark, Amazon SES, and more.
      </p>

      <SmtpSettingsForm tenantId={owner.id} settings={settings} />
    </div>
  );
}
