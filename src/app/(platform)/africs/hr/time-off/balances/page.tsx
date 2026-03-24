import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getAllLeaveBalances } from "@/lib/actions/leave";
import { notFound } from "next/navigation";
import { LeaveBalanceTable } from "@/components/leave/leave-balance-table";

export default async function LeaveBalancesPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const year = new Date().getFullYear();
  const balances = await getAllLeaveBalances(year);

  return (
    <div>
      <TopBar
        title="Leave Balances"
        subtitle={`${year} leave allocations and usage`}
        actions={
          <Link href="/africs/hr/time-off">
            <Button size="sm" variant="ghost" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <LeaveBalanceTable balances={balances} year={year} />
      </div>
    </div>
  );
}
