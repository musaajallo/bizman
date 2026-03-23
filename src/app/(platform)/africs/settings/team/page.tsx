import { Badge } from "@/components/ui/badge";

export default function TeamSettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Team</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Manage team members, roles, and permissions.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Invite users, assign roles, and manage access will be available here.
        </p>
      </div>
    </div>
  );
}
