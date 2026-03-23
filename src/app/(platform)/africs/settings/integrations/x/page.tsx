import { Badge } from "@/components/ui/badge";

export default function XIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">X</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your X (formerly Twitter) account for posting and engagement tracking.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Tweet scheduling, thread management, analytics, and audience insights will be available here.
        </p>
      </div>
    </div>
  );
}
