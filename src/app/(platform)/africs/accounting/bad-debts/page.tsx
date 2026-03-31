import { TopBar } from "@/components/layout/top-bar";
import {
  getARAgingWithNRV,
  getCurrentAllowanceBalance,
  getBadDebtConfig,
} from "@/lib/actions/accounting/bad-debts";
import { BadDebtsClient } from "@/components/accounting/bad-debts-client";

export default async function BadDebtsPage() {
  const [aging, currentGL, agingBuckets] = await Promise.all([
    getARAgingWithNRV(),
    getCurrentAllowanceBalance(),
    getBadDebtConfig(),
  ]);

  if (!aging) {
    return (
      <div>
        <TopBar title="AR Allowance & Bad Debts" subtitle="IFRS-compliant bad debt estimation and write-offs" />
        <div className="p-6 text-sm text-muted-foreground">Unable to load data.</div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="AR Allowance & Bad Debts"
        subtitle="Allowance for doubtful accounts, write-offs, and recoveries"
      />
      <div className="p-6">
        <BadDebtsClient
          rows={aging.rows}
          bucketSummary={aging.bucketSummary}
          totalGrossAR={aging.totalGrossAR}
          totalAllowance={aging.totalAllowance}
          totalNRV={aging.totalNRV}
          currentGLBalance={currentGL}
          agingBuckets={agingBuckets}
        />
      </div>
    </div>
  );
}
