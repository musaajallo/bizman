import { TopBar } from "@/components/layout/top-bar";
import { getFinanceDashboard } from "@/lib/actions/accounting/statements";
import { FinanceDashboardClient } from "@/components/finance/finance-dashboard-client";

export default async function FinanceDashboardPage() {
  const data = await getFinanceDashboard();

  return (
    <div>
      <TopBar title="Finance Dashboard" subtitle="Financial health overview — P&L, cash position, KPIs" />
      <div className="p-6">
        <FinanceDashboardClient data={data} />
      </div>
    </div>
  );
}
