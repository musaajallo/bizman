import { TopBar } from "@/components/layout/top-bar";
import { getIncomeStatement } from "@/lib/actions/accounting/statements";
import { IncomeStatementClient } from "@/components/finance/income-statement-client";

export default async function PlPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const fromDate = from ?? defaultFrom;
  const toDate   = to   ?? defaultTo;

  const data = await getIncomeStatement(new Date(fromDate), new Date(toDate));

  return (
    <div>
      <TopBar title="Profit & Loss" subtitle="Income and expense statement for any period" />
      <div className="p-6">
        <IncomeStatementClient data={data} from={fromDate} to={toDate} />
      </div>
    </div>
  );
}
