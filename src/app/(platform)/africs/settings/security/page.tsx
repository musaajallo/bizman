import { Badge } from "@/components/ui/badge";

export default function SecuritySettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Security</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Password, two-factor authentication, and session management.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Change password, enable 2FA, and manage active sessions will be available here.
        </p>
      </div>
    </div>
  );
}
