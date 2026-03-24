import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getOvertimeRequests, getOvertimeDashboardStats } from "@/lib/actions/overtime";
import { OvertimeDashboardCards } from "@/components/overtime/overtime-dashboard-cards";
import { OvertimeRequestTable } from "@/components/overtime/overtime-request-table";

export default async function OvertimePage() {
  const [stats, requests] = await Promise.all([
    getOvertimeDashboardStats(),
    getOvertimeRequests(),
  ]);

  return (
    <div>
      <TopBar
        title="Overtime"
        subtitle="Overtime requests and approvals"
        actions={
          <Link href="/africs/hr/overtime/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />New Request
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <OvertimeDashboardCards stats={stats} />
        <OvertimeRequestTable requests={requests} />
      </div>
    </div>
  );
}
