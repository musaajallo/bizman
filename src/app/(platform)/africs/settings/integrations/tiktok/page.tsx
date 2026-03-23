import { Badge } from "@/components/ui/badge";

export default function TikTokIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">TikTok</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your TikTok Business account for short-form video marketing.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Video publishing, trend analytics, audience insights, and TikTok Ads integration will be available here.
        </p>
      </div>
    </div>
  );
}
