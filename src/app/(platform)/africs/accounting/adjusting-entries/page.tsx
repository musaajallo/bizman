import { TopBar } from "@/components/layout/top-bar";
import { getAdjustingEntries, getAdjustingTemplates } from "@/lib/actions/accounting/adjusting-entries";
import { getTrialBalanceFiltered } from "@/lib/actions/accounting/adjusting-entries";
import { getLedgerAccounts } from "@/lib/actions/accounting/accounts";
import { getAccountingPeriods } from "@/lib/actions/accounting/periods";
import { AdjustingEntriesClient } from "@/components/accounting/adjusting-entries-client";

export default async function AdjustingEntriesPage() {
  const now = new Date();

  const [entries, templates, accounts, periods, adjustedTB, unadjustedTB] = await Promise.all([
    getAdjustingEntries(),
    getAdjustingTemplates(),
    getLedgerAccounts(),
    getAccountingPeriods(),
    getTrialBalanceFiltered(now, false),
    getTrialBalanceFiltered(now, true),
  ]);

  // Serialize entries for client component
  const serializedEntries = entries.map((e) => ({
    id:          e.id,
    date:        e.date.toISOString(),
    description: e.description,
    reference:   e.reference,
    isReversing: e.isReversing,
    reversesId:  e.reversesId,
    period:      { name: e.period.name },
    lines:       e.lines.map((l) => ({
      id:          l.id,
      debit:       Number(l.debit),
      credit:      Number(l.credit),
      description: l.description,
      account:     { code: l.account.code, name: l.account.name, type: l.account.type },
    })),
  }));

  const serializedTemplates = templates.map((t) => ({
    id:            t.id,
    name:          t.name,
    type:          t.type,
    amount:        Number(t.amount),
    description:   t.description,
    isReversing:   t.isReversing,
    debitAccount:  { id: t.debitAccount.id, code: t.debitAccount.code, name: t.debitAccount.name },
    creditAccount: { id: t.creditAccount.id, code: t.creditAccount.code, name: t.creditAccount.name },
  }));

  const serializedAccounts = accounts.map((a) => ({
    id:   a.id,
    code: a.code,
    name: a.name,
    type: a.type,
  }));

  const serializedPeriods = periods.map((p) => ({
    id:   p.id,
    name: p.name,
  }));

  return (
    <div>
      <TopBar
        title="Adjusting Entries"
        subtitle="Period-end accruals, deferrals, and reversing entries"
      />
      <div className="p-6">
        <AdjustingEntriesClient
          entries={serializedEntries}
          templates={serializedTemplates}
          accounts={serializedAccounts}
          periods={serializedPeriods}
          adjustedTB={adjustedTB}
          unadjustedTB={unadjustedTB}
        />
      </div>
    </div>
  );
}
