import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getLeaveDashboardStats, getLeaveRequests } from "@/lib/actions/leave";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { LeaveDashboardCards } from "@/components/leave/leave-dashboard-cards";
import { LeaveRequestTable } from "@/components/leave/leave-request-table";
import { Plus } from "lucide-react";

export default async function TimeOffPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [stats, requests] = await Promise.all([
    getLeaveDashboardStats(),
    getLeaveRequests(),
  ]);

  // Serialize dates before passing to client components
  const serialized = requests.map((r) => ({
    ...r,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <TopBar
        title="Time Off"
        subtitle="Leave requests and balances"
        actions={
          <div className="flex gap-2">
            <Link href="/africs/hr/time-off/balances">
              <Button size="sm" variant="outline">Balances</Button>
            </Link>
            <Link href="/africs/hr/time-off/requests/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Request
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <LeaveDashboardCards
          pending={stats.pending}
          approved={stats.approved}
          onLeaveNow={stats.onLeaveNow}
          totalRequests={stats.totalRequests}
        />
        <div>
          <h3 className="text-sm font-semibold mb-3">All Leave Requests</h3>
          <LeaveRequestTable requests={serialized} />
        </div>
      </div>
    </div>
  );
}
