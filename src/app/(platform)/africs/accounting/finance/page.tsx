import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function FinancePage() {
  return (
    <div>
      <TopBar title="Finance" subtitle="Financial management and reporting" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <Banknote className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Finance</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Financial statements, budgeting, and cash flow management are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
