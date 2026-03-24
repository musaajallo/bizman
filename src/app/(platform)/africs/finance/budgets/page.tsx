import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function BudgetsPage() {
  return (
    <div>
      <TopBar title="Budgets" subtitle="Budget planning and actuals tracking" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Budgets</p>
            <p className="text-xs text-muted-foreground max-w-xs">Budget planning and actuals tracking. Coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
