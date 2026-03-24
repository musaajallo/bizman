import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getBills, getBillStats } from "@/lib/actions/bills";
import { BILL_STATUSES } from "@/lib/bill-constants";
import { BillListTable } from "@/components/bills/bill-list-table";
import { BillStatsCards } from "@/components/bills/bill-stats-cards";
import { Plus } from "lucide-react";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [bills, stats] = await Promise.all([getBills({ status }), getBillStats()]);

  return (
    <div>
      <TopBar
        title="Bills"
        subtitle="Supplier invoices and payment tracking"
        actions={
          <Link href="/africs/accounting/bills/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Bill
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        <BillStatsCards stats={stats} />
        <div className="flex gap-1 border-b border-border pb-0">
          {BILL_STATUSES.map((s) => {
            const isActive = (status ?? "") === s.value;
            const href = s.value ? `/africs/accounting/bills?status=${s.value}` : "/africs/accounting/bills";
            return (
              <Link
                key={s.value}
                href={href}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <BillListTable bills={bills} />
      </div>
    </div>
  );
}
