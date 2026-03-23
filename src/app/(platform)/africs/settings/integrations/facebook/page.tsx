import { Badge } from "@/components/ui/badge";

export default function FacebookIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Facebook</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your Facebook Business page for publishing and analytics.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Page connection, post scheduling, audience insights, and ad management will be available here.
        </p>
      </div>
    </div>
  );
}
