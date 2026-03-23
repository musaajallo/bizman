import { Badge } from "@/components/ui/badge";

export default function ClaudeIntegrationPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Claude</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect Claude AI for intelligent automation and assistance.
      </p>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          API key configuration, AI-powered features, document analysis, and smart suggestions will be available here.
        </p>
      </div>
    </div>
  );
}
