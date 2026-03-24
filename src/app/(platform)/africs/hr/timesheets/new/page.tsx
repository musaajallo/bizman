import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { NewTimesheetForm } from "@/components/timesheets/new-timesheet-form";
import { ArrowLeft } from "lucide-react";

export default async function NewTimesheetPage() {
  const owner = await getOwnerBusiness();
  const employees = owner ? await getEmployeesForSelect(owner.id) : [];

  return (
    <div>
      <TopBar
        title="New Timesheet"
        subtitle="Create a weekly timesheet for an employee"
        actions={
          <Link href="/africs/hr/timesheets">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <NewTimesheetForm employees={employees} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
