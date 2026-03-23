import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Fuel } from "lucide-react";

export default function FuelManagementPage() {
  return (
    <div>
      <TopBar title="Fuel Management" subtitle="Logs, efficiency, and fuel card integration" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <Fuel className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Fuel Management</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Fuel logs, consumption tracking, efficiency analytics, and fuel card integration are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
