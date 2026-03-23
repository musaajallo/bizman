import { Badge } from "@/components/ui/badge";

export default function WhatsAppIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">WhatsApp</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your WhatsApp Business account for messaging and notifications.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          WhatsApp Business API integration, message templates, and automated notifications will be available here.
        </p>
      </div>
    </div>
  );
}
