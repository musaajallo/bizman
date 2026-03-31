import { TopBar } from "@/components/layout/top-bar";
import { getRetainedEarningsStatement } from "@/lib/actions/accounting/statements";
import { RetainedEarningsClient } from "@/components/finance/retained-earnings-client";

export default async function RetainedEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; priorFrom?: string; priorTo?: string }>;
}) {
  const { from, to, priorFrom, priorTo } = await searchParams;

  const now          = new Date();
  const defaultFrom  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const fromDate  = from  ?? defaultFrom;
  const toDate    = to    ?? defaultTo;

  const data = await getRetainedEarningsStatement(
    new Date(fromDate),
    new Date(toDate),
    priorFrom ? new Date(priorFrom) : undefined,
    priorTo   ? new Date(priorTo)   : undefined,
  );

  return (
    <div>
      <TopBar
        title="Retained Earnings"
        subtitle="Statement of retained earnings — opening, net income, drawings, closing"
      />
      <div className="p-6">
        <RetainedEarningsClient
          data={data}
          from={fromDate}
          to={toDate}
          priorFrom={priorFrom}
          priorTo={priorTo}
        />
      </div>
    </div>
  );
}
