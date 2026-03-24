import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getRequisitions, getPurchaseOrders, getProcurementStats } from "@/lib/actions/procurement";
import { ProcurementStatsCards } from "@/components/procurement/procurement-stats-cards";
import { RequisitionListTable } from "@/components/procurement/requisition-list-table";
import { PoListTable } from "@/components/procurement/po-list-table";
import { Plus } from "lucide-react";

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "requisitions" } = await searchParams;

  const [stats, requisitions, orders] = await Promise.all([
    getProcurementStats(),
    tab === "requisitions" ? getRequisitions() : Promise.resolve([]),
    tab === "orders" ? getPurchaseOrders() : Promise.resolve([]),
  ]);

  const tabs = [
    { id: "requisitions", label: "Requisitions" },
    { id: "orders",       label: "Purchase Orders" },
  ];

  return (
    <div>
      <TopBar
        title="Procurement"
        subtitle="Purchase requisitions and orders"
        actions={
          <div className="flex items-center gap-2">
            {tab === "requisitions" && (
              <Link href="/africs/accounting/procurement/requisitions/new">
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Requisition</Button>
              </Link>
            )}
            {tab === "orders" && (
              <Link href="/africs/accounting/procurement/orders/new">
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Purchase Order</Button>
              </Link>
            )}
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <ProcurementStatsCards stats={stats} />

        <div className="flex gap-1 border-b border-border pb-0">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/africs/accounting/procurement?tab=${t.id}`}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "requisitions" && <RequisitionListTable requisitions={requisitions} />}
        {tab === "orders" && <PoListTable orders={orders} />}
      </div>
    </div>
  );
}
