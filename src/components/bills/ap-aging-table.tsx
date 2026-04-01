"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgingRow, APAgingReport, AgingBucket } from "@/lib/actions/bills";

function fmt(n: number) {
  return new Intl.NumberFormat("en-GM", { style: "currency", currency: "GMD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const BUCKET_STYLES: Record<AgingBucket, { label: string; className: string }> = {
  current: { label: "Current",  className: "text-emerald-500 border-emerald-500/40" },
  "1-30":  { label: "1–30d",    className: "text-amber-400 border-amber-400/40" },
  "31-60": { label: "31–60d",   className: "text-orange-400 border-orange-400/40" },
  "61-90": { label: "61–90d",   className: "text-red-400 border-red-400/40" },
  "90+":   { label: "90d+",     className: "text-red-600 border-red-600/40" },
};

const BUCKETS: AgingBucket[] = ["current", "1-30", "31-60", "61-90", "90+"];

export function APAgingTable({ report }: { report: APAgingReport }) {
  const { rows, totals } = report;

  if (rows.length === 0) {
    return (
      <Card>
        <div className="py-16 text-center text-sm text-muted-foreground">
          No outstanding bills. All caught up!
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {BUCKETS.map((b) => (
          <Card key={b} className="p-3">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${BUCKET_STYLES[b].className}`}>
              {BUCKET_STYLES[b].label}
            </p>
            <p className="font-mono text-sm font-bold">{fmt(totals[b])}</p>
          </Card>
        ))}
        <Card className="p-3 border-primary/30">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-primary">Total</p>
          <p className="font-mono text-sm font-bold">{fmt(totals.grand)}</p>
        </Card>
      </div>

      {/* Detail table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Bill #</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Days Overdue</th>
                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Outstanding</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Bucket</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: AgingRow) => (
                <tr key={row.billId} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-4 font-medium">{row.vendorName}</td>
                  <td className="py-2.5 px-4">
                    <Link href={`/africs/accounting/bills/${row.billId}`} className="font-mono text-xs text-primary hover:underline">
                      {row.billNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.title}</p>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell">{fmtDate(row.dueDate)}</td>
                  <td className="py-2.5 px-4 text-right hidden sm:table-cell">
                    {row.daysOverdue === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className="text-xs text-red-400 font-mono">{row.daysOverdue}d</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-sm font-semibold">
                    {fmt(row.amountOutstanding)}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${BUCKET_STYLES[row.bucket].className}`}>
                      {BUCKET_STYLES[row.bucket].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30">
                <td colSpan={4} className="py-2.5 px-4 text-sm font-semibold">Total Outstanding</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold">{fmt(totals.grand)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
