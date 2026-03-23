import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function SmsMarketingPage() {
  return (
    <div>
      <TopBar title="SMS Marketing" subtitle="Text message campaigns and notifications" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">SMS Marketing</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              SMS campaigns, bulk messaging, and delivery tracking are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
