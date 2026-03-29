import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, List, Calendar, Cpu } from "lucide-react";
import { getAttendanceDashboard } from "@/lib/actions/attendance";
import { AttendanceDashboardCards } from "@/components/attendance/attendance-dashboard-cards";

export default async function AttendancePage() {
  const data = await getAttendanceDashboard();

  return (
    <div>
      <TopBar
        title="Attendance"
        subtitle="Shifts, clock-in records and daily logs"
        actions={
          <div className="flex gap-2">
            <Link href="/africs/hr/attendance/shifts">
              <Button size="sm" variant="outline" className="gap-2">
                <Clock className="h-4 w-4" />Shifts
              </Button>
            </Link>
            <Link href="/africs/hr/attendance/records">
              <Button size="sm" variant="outline" className="gap-2">
                <List className="h-4 w-4" />Records
              </Button>
            </Link>
            <Link href="/africs/hr/attendance/logs">
              <Button size="sm" variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />Logs
              </Button>
            </Link>
            <Link href="/africs/hr/attendance/devices">
              <Button size="sm" variant="outline" className="gap-2">
                <Cpu className="h-4 w-4" />Devices
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <AttendanceDashboardCards data={data} />
      </div>
    </div>
  );
}
