"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import type { IncomeStatement, PLLine, PLPeriodData } from "@/lib/actions/accounting/statements";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function variance(current: number, prior: number) {
  const v = current - prior;
  return { value: v, pct: prior !== 0 ? (v / Math.abs(prior)) * 100 : null };
}

interface Props {
  data: IncomeStatement | null;
  from: string;
  to: string;
  priorFrom?: string;
  priorTo?: string;
}

export function IncomeStatementClient({ data, from, to, priorFrom, priorTo }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      from: fd.get("from") as string,
      to:   fd.get("to")   as string,
    });
    const pf = fd.get("priorFrom") as string;
    const pt = fd.get("priorTo")   as string;
    if (pf && pt) { params.set("priorFrom", pf); params.set("priorTo", pt); }
    router.push(`${pathname}?${params}`);
  }

  const hasPrior = !!data?.prior;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label htmlFor="from" className="text-xs">From</Label>
                <Input id="from" name="from" type="date" defaultValue={from} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to" className="text-xs">To</Label>
                <Input id="to" name="to" type="date" defaultValue={to} className="h-8 text-sm w-40" />
              </div>
              <div className="border-l mx-1 self-stretch" />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prior From (comparative)</Label>
                <Input name="priorFrom" type="date" defaultValue={priorFrom ?? ""} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prior To</Label>
                <Input name="priorTo" type="date" defaultValue={priorTo ?? ""} className="h-8 text-sm w-40" />
              </div>
            </div>
            <Button type="submit" size="sm">Apply</Button>
            <div className="ml-auto flex gap-2">
              <a href={`/api/finance/pl/csv?from=${from}&to=${to}`} download>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />CSV
                </Button>
              </a>
              <a href={`/api/finance/pl/pdf?from=${from}&to=${to}`} download>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />PDF
                </Button>
              </a>
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Income Statement (Profit &amp; Loss)</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(data.period.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {" – "}
                  {new Date(data.period.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {hasPrior && <Badge variant="outline" className="text-xs">Comparative</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasPrior && (
              <div className="flex justify-end gap-2 px-2 pb-1 border-b">
                <span className="text-xs text-muted-foreground w-28 text-right">Prior Period</span>
                <span className="text-xs font-medium w-28 text-right">Current</span>
                <span className="text-xs text-muted-foreground w-24 text-right">Change</span>
              </div>
            )}

            <PLSection title="Revenue"            lines={data.revenue}     total={data.totalRevenue}     priorLines={data.prior?.revenue}     priorTotal={data.prior?.totalRevenue} />
            <PLSection title="Cost of Sales"      lines={data.costOfSales} total={data.totalCostOfSales} priorLines={data.prior?.costOfSales}  priorTotal={data.prior?.totalCostOfSales} />

            <ComparativeSummaryRow label="Gross Profit"      current={data.grossProfit}      prior={data.prior?.grossProfit}      badge={`${data.grossMargin.toFixed(1)}% margin`} />
            <Separator />
            <PLSection title="Operating Expenses" lines={data.opExpenses}  total={data.totalOpExpenses}  priorLines={data.prior?.opExpenses}   priorTotal={data.prior?.totalOpExpenses} />
            <ComparativeSummaryRow label="Operating Income"  current={data.operatingIncome}  prior={data.prior?.operatingIncome}  badge={`${data.operatingMargin.toFixed(1)}% margin`} />

            {data.nonOperating.length > 0 && (
              <>
                <Separator />
                <PLSection title="Non-Operating" lines={data.nonOperating} total={data.totalNonOperating} priorLines={data.prior?.nonOperating} priorTotal={data.prior?.totalNonOperating} />
              </>
            )}

            <Separator />
            <ComparativeSummaryRow label="Net Income" current={data.netIncome} prior={data.prior?.netIncome} badge={`${data.netMargin.toFixed(1)}% net margin`} strong />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PLSection({
  title, lines, total, priorLines, priorTotal,
}: {
  title: string; lines: PLLine[]; total: number;
  priorLines?: PLLine[]; priorTotal?: number;
}) {
  if (lines.length === 0 && (!priorLines || priorLines.length === 0)) return null;
  const hasPrior = priorLines !== undefined;

  // Build a unified list of codes across both periods
  const allCodes = Array.from(new Set([
    ...lines.map(l => l.code),
    ...(priorLines?.map(l => l.code) ?? []),
  ]));

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1">
        {allCodes.map((code) => {
          const cur  = lines.find(l => l.code === code);
          const prev = priorLines?.find(l => l.code === code);
          const name = cur?.name ?? prev?.name ?? code;
          const v    = hasPrior ? variance(cur?.amount ?? 0, prev?.amount ?? 0) : null;
          return (
            <div key={code} className="flex justify-between items-center text-sm py-0.5 px-2 rounded hover:bg-secondary/50">
              <span className="text-muted-foreground flex-1">
                <span className="font-mono text-xs mr-2">{code}</span>{name}
              </span>
              <div className="flex items-center gap-2">
                {hasPrior && (
                  <span className="font-mono tabular-nums text-muted-foreground w-28 text-right text-xs">
                    {prev ? fmt(prev.amount) : "—"}
                  </span>
                )}
                <span className="font-mono tabular-nums w-28 text-right">
                  {cur ? fmt(cur.amount) : "—"}
                </span>
                {v !== null && (
                  <span className={`font-mono tabular-nums text-xs w-24 text-right ${v.value > 0 ? "text-emerald-500" : v.value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {v.value > 0 ? "+" : ""}{fmt(v.value)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between items-center text-sm font-medium border-t pt-1.5 mt-1 px-2">
          <span>Total {title}</span>
          <div className="flex items-center gap-2">
            {hasPrior && (
              <span className="font-mono tabular-nums text-muted-foreground w-28 text-right text-xs">
                {priorTotal !== undefined ? fmt(priorTotal) : "—"}
              </span>
            )}
            <span className="font-mono tabular-nums w-28 text-right">{fmt(total)}</span>
            {hasPrior && priorTotal !== undefined && (() => {
              const v = variance(total, priorTotal);
              return (
                <span className={`font-mono tabular-nums text-xs w-24 text-right ${v.value > 0 ? "text-emerald-500" : v.value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {v.value > 0 ? "+" : ""}{fmt(v.value)}
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparativeSummaryRow({
  label, current, prior, badge, strong,
}: {
  label: string; current: number; prior?: number; badge?: string; strong?: boolean;
}) {
  const isNeg = current < 0;
  const v = prior !== undefined ? variance(current, prior) : null;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-md bg-secondary gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`text-sm ${strong ? "font-bold" : "font-semibold"} truncate`}>{label}</span>
        {badge && (
          <Badge variant={isNeg ? "destructive" : "secondary"} className="text-xs font-normal shrink-0">
            {badge}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {prior !== undefined && (
          <span className="font-mono tabular-nums text-sm text-muted-foreground w-28 text-right">
            {fmt(prior)}
          </span>
        )}
        <span className={`font-mono tabular-nums text-sm w-28 text-right ${strong ? "font-bold" : "font-semibold"} ${isNeg ? "text-destructive" : ""}`}>
          {fmt(current)}
        </span>
        {v !== null && (
          <span className={`font-mono tabular-nums text-xs w-24 text-right ${v.value > 0 ? "text-emerald-500" : v.value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {v.value > 0 ? "+" : ""}{fmt(v.value)}
            {v.pct !== null && ` (${v.pct.toFixed(1)}%)`}
          </span>
        )}
      </div>
    </div>
  );
}

// Keep legacy export for PDF API route (no comparative columns needed there)
export type { PLPeriodData };
