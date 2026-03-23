import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { IdCard } from "lucide-react";

export default function DriversPage() {
  return (
    <div>
      <TopBar title="Drivers" subtitle="Driver profiles, licenses, and assignments" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <IdCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Drivers</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Driver profiles linked to employees, license tracking, vehicle assignments, and violation records are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
