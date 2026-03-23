import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function UtilizationPage() {
  return (
    <div>
      <TopBar title="Utilization" subtitle="Idle time, mileage, and assignment history" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Utilization</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Vehicle idle time, mileage reports, assignment history, and usage analytics are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
