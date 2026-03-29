import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAttendanceDevices } from "@/lib/actions/attendance";
import { DevicesTable } from "@/components/attendance/devices-table";

export default async function AttendanceDevicesPage() {
  const devices = await getAttendanceDevices();

  return (
    <div>
      <TopBar
        title="Attendance Devices"
        subtitle="Register and manage hardware attendance devices"
        actions={
          <Link href="/africs/hr/attendance">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <DevicesTable devices={devices} />
      </div>
    </div>
  );
}
