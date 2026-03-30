import { TopBar } from "@/components/layout/top-bar";
import { getBalanceSheet } from "@/lib/actions/accounting/statements";
import { BalanceSheetClient } from "@/components/finance/balance-sheet-client";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { asOf } = await searchParams;

  const defaultAsOf = new Date().toISOString().split("T")[0];
  const asOfDate = asOf ?? defaultAsOf;

  const data = await getBalanceSheet(new Date(asOfDate));

  return (
    <div>
      <TopBar title="Balance Sheet" subtitle="Assets, liabilities, and equity snapshot" />
      <div className="p-6">
        <BalanceSheetClient data={data} asOf={asOfDate} />
      </div>
    </div>
  );
}
