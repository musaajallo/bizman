import { TopBar } from "@/components/layout/top-bar";
import { getAccountingPeriods } from "@/lib/actions/accounting/periods";
import { AccountingPeriodsClient } from "@/components/accounting/accounting-periods-client";

export default async function AccountingPeriodsPage() {
  const periods = await getAccountingPeriods();

  return (
    <div>
      <TopBar
        title="Accounting Periods"
        subtitle="Manage your fiscal periods — open, close, and lock periods for reporting"
      />
      <div className="p-6">
        <AccountingPeriodsClient periods={periods} />
      </div>
    </div>
  );
}
