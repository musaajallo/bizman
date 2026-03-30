import { TopBar } from "@/components/layout/top-bar";
import { getLedgerAccounts, isAccountingInitialized } from "@/lib/actions/accounting/accounts";
import { ChartOfAccountsClient } from "@/components/accounting/chart-of-accounts-client";

export default async function ChartOfAccountsPage() {
  const [initialized, accounts] = await Promise.all([
    isAccountingInitialized(),
    getLedgerAccounts(),
  ]);

  return (
    <div>
      <TopBar
        title="Chart of Accounts"
        subtitle="Manage the accounts used in your general ledger"
      />
      <div className="p-6">
        <ChartOfAccountsClient accounts={accounts} initialized={initialized} />
      </div>
    </div>
  );
}
