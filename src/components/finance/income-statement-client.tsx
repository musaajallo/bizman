"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import type { IncomeStatement, PLLine } from "@/lib/actions/accounting/statements";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface Props {
  data: IncomeStatement | null;
  from: string;
  to: string;
}

export function IncomeStatementClient({ data, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = fd.get("from") as string;
    const t = fd.get("to") as string;
    router.push(`${pathname}?from=${f}&to=${t}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" name="from" type="date" defaultValue={from} className="h-8 text-sm w-40" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" name="to" type="date" defaultValue={to} className="h-8 text-sm w-40" />
            </div>
            <Button type="submit" size="sm">Apply</Button>
            <a
              href={`/api/finance/pl/pdf?from=${from}&to=${to}`}
              download
              className="ml-auto"
            >
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
            </a>
          </form>
        </CardContent>
      </Card>

      {!data ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground py-12">
            No data for the selected period. Try a different date range or initialize accounting.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Income Statement (Profit &amp; Loss)</CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(data.period.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {" – "}
              {new Date(data.period.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <PLSection title="Revenue" lines={data.revenue} total={data.totalRevenue} />

            <PLSection title="Cost of Sales" lines={data.costOfSales} total={data.totalCostOfSales} />

            <SummaryRow
              label="Gross Profit"
              amount={data.grossProfit}
              badge={`${data.grossMargin.toFixed(1)}% margin`}
            />

            <Separator />

            <PLSection title="Operating Expenses" lines={data.opExpenses} total={data.totalOpExpenses} />

            <SummaryRow
              label="Operating Income"
              amount={data.operatingIncome}
              badge={`${data.operatingMargin.toFixed(1)}% margin`}
            />

            {data.nonOperating.length > 0 && (
              <>
                <Separator />
                <PLSection title="Non-Operating" lines={data.nonOperating} total={data.totalNonOperating} />
              </>
            )}

            <Separator />

            <SummaryRow
              label="Net Income"
              amount={data.netIncome}
              badge={`${data.netMargin.toFixed(1)}% net margin`}
              strong
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PLSection({ title, lines, total }: { title: string; lines: PLLine[]; total: number }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1">
        {lines.map((l) => (
          <div key={l.code} className="flex justify-between items-center text-sm py-0.5 px-2 rounded hover:bg-secondary/50">
            <span className="text-muted-foreground">
              <span className="font-mono text-xs mr-2">{l.code}</span>{l.name}
            </span>
            <span className="font-mono tabular-nums">{fmt(l.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center text-sm font-medium border-t pt-1.5 mt-1 px-2">
          <span>Total {title}</span>
          <span className="font-mono tabular-nums">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label, amount, badge, strong,
}: {
  label: string; amount: number; badge?: string; strong?: boolean;
}) {
  const isNeg = amount < 0;
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-md bg-secondary gap-4`}>
      <div className="flex items-center gap-2 flex-1">
        <span className={`text-sm ${strong ? "font-bold" : "font-semibold"}`}>{label}</span>
        {badge && (
          <Badge variant={isNeg ? "destructive" : "secondary"} className="text-xs font-normal">
            {badge}
          </Badge>
        )}
      </div>
      <span className={`font-mono tabular-nums text-sm ${strong ? "font-bold" : "font-semibold"} ${isNeg ? "text-destructive" : ""}`}>
        {fmt(amount)}
      </span>
    </div>
  );
}
