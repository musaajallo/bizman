import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function TimesheetsPage() {
  return (
    <div>
      <TopBar title="Timesheets" subtitle="Time tracking and reporting" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Timesheets</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Time tracking, billable hours, and timesheet approvals are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
