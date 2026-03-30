import { TopBar } from "@/components/layout/top-bar";
import { getOwnerGeneralLedger, getOwnerTrialBalance } from "@/lib/actions/accounting/journal";
import { GeneralLedgerClient } from "@/components/accounting/general-ledger-client";

export default async function GeneralLedgerPage() {
  const [ledger, trialBalance] = await Promise.all([
    getOwnerGeneralLedger(),
    getOwnerTrialBalance(new Date()),
  ]);

  return (
    <div>
      <TopBar
        title="General Ledger"
        subtitle="Account balances and transaction history across all ledger accounts"
      />
      <div className="p-6">
        <GeneralLedgerClient ledger={ledger} trialBalance={trialBalance} />
      </div>
    </div>
  );
}
