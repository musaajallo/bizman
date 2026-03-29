import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { getShifts } from "@/lib/actions/attendance";
import { ShiftsTable } from "@/components/attendance/shifts-table";

export default async function ShiftsPage() {
  const shifts = await getShifts();

  return (
    <div>
      <TopBar
        title="Shifts"
        subtitle="Configure work shifts and assign them to employees"
        actions={
          <div className="flex gap-2">
            <Link href="/africs/hr/attendance">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
            <Link href="/africs/hr/attendance/shifts/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />New Shift
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <ShiftsTable shifts={shifts} />
      </div>
    </div>
  );
}
