import { TopBar } from "@/components/layout/top-bar";
import { getForecastData } from "@/lib/actions/accounting/forecasting";
import { ForecastingClient } from "@/components/accounting/forecasting-client";

export default async function ForecastingPage() {
  const data = await getForecastData();

  return (
    <div>
      <TopBar
        title="Forecasting"
        subtitle="12-month rolling cash flow, revenue and expense projections"
      />
      <div className="p-6">
        {data ? (
          <ForecastingClient data={data} />
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load forecast data.</p>
        )}
      </div>
    </div>
  );
}
