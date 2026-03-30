import { TopBar } from "@/components/layout/top-bar";
import { getOwnerJournalEntries } from "@/lib/actions/accounting/journal";
import { getAccountingPeriods } from "@/lib/actions/accounting/periods";
import { JournalEntriesClient } from "@/components/accounting/journal-entries-client";

export default async function JournalEntriesPage() {
  const [entries, periods] = await Promise.all([
    getOwnerJournalEntries({ limit: 200 }),
    getAccountingPeriods(),
  ]);

  return (
    <div>
      <TopBar
        title="Journal Entries"
        subtitle="All double-entry transactions posted to the general ledger"
      />
      <div className="p-6">
        <JournalEntriesClient entries={entries} periods={periods} />
      </div>
    </div>
  );
}
