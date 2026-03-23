import { Badge } from "@/components/ui/badge";

export default function YouTubeIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">YouTube</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your YouTube channel for video management and analytics.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Video uploads, channel analytics, subscriber metrics, and content scheduling will be available here.
        </p>
      </div>
    </div>
  );
}
