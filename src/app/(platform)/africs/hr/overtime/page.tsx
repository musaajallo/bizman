import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { AlarmClock } from "lucide-react";

export default function OvertimePage() {
  return (
    <div>
      <TopBar title="Overtime" subtitle="Overtime requests and tracking" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <AlarmClock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Overtime</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Overtime requests, approvals, and compensation tracking are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
