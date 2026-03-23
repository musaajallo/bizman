import { Badge } from "@/components/ui/badge";

export default function LinkedInIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">LinkedIn</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your LinkedIn company page for professional content and networking.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Post publishing, company page analytics, lead generation, and employee advocacy will be available here.
        </p>
      </div>
    </div>
  );
}
