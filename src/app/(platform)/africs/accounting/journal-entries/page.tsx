import { TopBar } from "@/components/layout/top-bar";
import { getOwnerJournalEntries } from "@/lib/actions/accounting/journal";
import { getAccountingPeriods } from "@/lib/actions/accounting/periods";
import { getLedgerAccounts } from "@/lib/actions/accounting/accounts";
import { JournalEntriesClient } from "@/components/accounting/journal-entries-client";
import { ManualJournalEntryDialog } from "@/components/accounting/manual-journal-entry-dialog";

export default async function JournalEntriesPage() {
  const [entries, periods, accounts] = await Promise.all([
    getOwnerJournalEntries({ limit: 200 }),
    getAccountingPeriods(),
    getLedgerAccounts(),
  ]);

  const activeAccounts = accounts
    .filter((a) => a.isActive)
    .map((a) => ({ id: a.id, code: a.code, name: a.name, type: a.type }));

  return (
    <div>
      <TopBar
        title="Journal Entries"
        subtitle="All double-entry transactions posted to the general ledger"
        actions={<ManualJournalEntryDialog accounts={activeAccounts} />}
      />
      <div className="p-6">
        <JournalEntriesClient entries={entries} periods={periods} />
      </div>
    </div>
  );
}
