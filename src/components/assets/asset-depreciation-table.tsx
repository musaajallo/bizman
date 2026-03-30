"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DepreciationEntry {
  id: string;
  date: string;
  periodName: string;
  amount: number;
  accumulatedTotal: number;
  journalEntryId: string | null;
}

export function AssetDepreciationTable({
  entries,
  currency,
  cost,
}: {
  entries: DepreciationEntry[];
  currency: string;
  cost: number;
}) {
  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No depreciation recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Accumulated</TableHead>
          <TableHead className="text-right">Book Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="text-sm">{e.periodName}</TableCell>
            <TableCell className="text-right font-mono text-sm text-amber-400">{fmt(e.amount)}</TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground">{fmt(e.accumulatedTotal)}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              {fmt(Math.max(0, cost - e.accumulatedTotal))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
