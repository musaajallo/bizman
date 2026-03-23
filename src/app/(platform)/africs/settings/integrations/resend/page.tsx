import { Badge } from "@/components/ui/badge";

export default function ResendIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Resend</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Configure Resend for transactional and marketing email delivery.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          API key setup, domain verification, email templates, and delivery analytics will be available here.
        </p>
      </div>
    </div>
  );
}
