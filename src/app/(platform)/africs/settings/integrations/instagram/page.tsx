import { Badge } from "@/components/ui/badge";

export default function InstagramIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Instagram</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your Instagram Business account for content publishing and engagement.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Post scheduling, stories, reels analytics, and DM management will be available here.
        </p>
      </div>
    </div>
  );
}
