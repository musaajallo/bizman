import { Badge } from "@/components/ui/badge";

export default function NotificationsSettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Control how and when you receive notifications.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Email, in-app, and push notification preferences will be available here.
        </p>
      </div>
    </div>
  );
}
