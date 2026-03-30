import { TopBar } from "@/components/layout/top-bar";
import { getFinanceDashboard } from "@/lib/actions/accounting/statements";
import { ForecastingClient } from "@/components/finance/forecasting-client";

export default async function ForecastingPage() {
  const data = await getFinanceDashboard();

  return (
    <div>
      <TopBar title="Forecasting" subtitle="Full-year projections based on YTD run rate" />
      <div className="p-6">
        <ForecastingClient data={data} />
      </div>
    </div>
  );
}
