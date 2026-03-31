import { TopBar } from "@/components/layout/top-bar";
import { getFinancialRatios } from "@/lib/actions/accounting/ratios";
import { RatiosDashboardClient } from "@/components/finance/ratios-dashboard-client";

export default async function FinancialRatiosPage() {
  const raw = await getFinancialRatios();

  const data = raw
    ? {
        ...raw,
        asOf:     raw.asOf.toISOString(),
        ytdStart: raw.ytdStart.toISOString(),
      }
    : null;

  return (
    <div>
      <TopBar
        title="Financial Ratios"
        subtitle="Liquidity, profitability, efficiency and solvency — benchmarks with 12-month trends"
      />
      <div className="p-6">
        {data ? (
          <RatiosDashboardClient data={data} />
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load ratio data.</p>
        )}
      </div>
    </div>
  );
}
