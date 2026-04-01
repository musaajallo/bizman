import { TopBar } from "@/components/layout/top-bar";
import { getCashFlowStatement } from "@/lib/actions/accounting/statements";
import { CashFlowClient } from "@/components/finance/cash-flow-client";

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; priorFrom?: string; priorTo?: string }>;
}) {
  const { from, to, priorFrom, priorTo } = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const fromDate = from ?? defaultFrom;
  const toDate   = to   ?? defaultTo;

  const data = await getCashFlowStatement(
    new Date(fromDate),
    new Date(toDate),
    priorFrom ? new Date(priorFrom) : undefined,
    priorTo   ? new Date(priorTo)   : undefined,
  );

  return (
    <div>
      <TopBar title="Cash Flow" subtitle="Cash inflows and outflows (indirect method)" />
      <div className="p-6">
        <CashFlowClient data={data} from={fromDate} to={toDate} priorFrom={priorFrom} priorTo={priorTo} />
      </div>
    </div>
  );
}
