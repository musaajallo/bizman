import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAttendanceLogs } from "@/lib/actions/attendance";
import { AttendanceLogsTable } from "@/components/attendance/attendance-logs-table";

export default async function AttendanceLogsPage() {
  const logs = await getAttendanceLogs();

  return (
    <div>
      <TopBar
        title="Daily Attendance Logs"
        subtitle="Processed attendance summaries per employee per day"
        actions={
          <Link href="/africs/hr/attendance">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <AttendanceLogsTable logs={logs} />
      </div>
    </div>
  );
}
