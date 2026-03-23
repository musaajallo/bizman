import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div>
      <TopBar title="Employees" subtitle="Employee directory and profiles" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Employees</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Employee directory, profiles, and records management are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
