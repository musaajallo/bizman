import { TopBar } from "@/components/layout/top-bar";
import { getBankAccounts, getLedgerCashAccounts } from "@/lib/actions/accounting/bank-reconciliation";
import { BankAccountsClient } from "@/components/accounting/bank-accounts-client";

export default async function BankReconciliationPage() {
  const [accounts, ledgerAccounts] = await Promise.all([
    getBankAccounts(),
    getLedgerCashAccounts(),
  ]);

  return (
    <div>
      <TopBar
        title="Bank Reconciliation"
        subtitle="Manage bank accounts and reconcile statements with your general ledger"
      />
      <div className="p-6 max-w-3xl">
        <BankAccountsClient accounts={accounts} ledgerAccounts={ledgerAccounts} />
      </div>
    </div>
  );
}
