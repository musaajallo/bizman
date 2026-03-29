import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAttendanceRecords } from "@/lib/actions/attendance";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { AttendanceRecordsTable } from "@/components/attendance/attendance-records-table";

export default async function AttendanceRecordsPage() {
  const owner = await getOwnerBusiness();
  const [records, employees] = await Promise.all([
    getAttendanceRecords(),
    owner ? getEmployeesForSelect(owner.id) : Promise.resolve([]),
  ]);

  return (
    <div>
      <TopBar
        title="Clock Records"
        subtitle="Raw clock-in / clock-out events"
        actions={
          <Link href="/africs/hr/attendance">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <AttendanceRecordsTable records={records} employees={employees} />
      </div>
    </div>
  );
}
