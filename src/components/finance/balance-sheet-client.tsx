"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Download } from "lucide-react";
import type { BalanceSheet, BSLine } from "@/lib/actions/accounting/statements";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  data: BalanceSheet | null;
  asOf: string;
  priorAsOf?: string;
}

export function BalanceSheetClient({ data, asOf, priorAsOf }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams({ asOf: fd.get("asOf") as string });
    const pa = fd.get("priorAsOf") as string;
    if (pa) params.set("priorAsOf", pa);
    router.push(`${pathname}?${params}`);
  }

  const sumLines = (lines: BSLine[]) =>
    lines.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);

  const hasPrior = !!data?.prior;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label htmlFor="asOf" className="text-xs">As of</Label>
                <Input id="asOf" name="asOf" type="date" defaultValue={asOf} className="h-8 text-sm w-40" />
              </div>
              <div className="border-l mx-1 self-stretch" />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Compare to (prior date)</Label>
                <Input name="priorAsOf" type="date" defaultValue={priorAsOf ?? ""} className="h-8 text-sm w-40" />
              </div>
            </div>
            <Button type="submit" size="sm">Apply</Button>
            <div className="ml-auto flex gap-2">
              <a href={`/api/finance/balance-sheet/csv?asOf=${asOf}`} download>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />CSV
                </Button>
              </a>
              <a href={`/api/finance/balance-sheet/pdf?asOf=${asOf}`} download>
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
            No accounting data available. Initialize accounting first.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm">
            {data.balanced ? (
              <><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-emerald-600 font-medium">Balanced</span></>
            ) : (
              <><XCircle className="h-4 w-4 text-destructive" /><span className="text-destructive font-medium">Out of balance — check journal entries</span></>
            )}
            <span className="text-muted-foreground text-xs ml-1">as of {fmtDate(data.asOf)}</span>
            {hasPrior && <Badge variant="outline" className="text-xs ml-2">Comparative</Badge>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ASSETS */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BSSection title="Current Assets"     lines={data.currentAssets}    total={sumLines(data.currentAssets)}    priorLines={data.prior?.currentAssets}    priorTotal={data.prior ? sumLines(data.prior.currentAssets) : undefined} />
                <BSSection title="Non-Current Assets" lines={data.nonCurrentAssets} total={sumLines(data.nonCurrentAssets)} priorLines={data.prior?.nonCurrentAssets} priorTotal={data.prior ? sumLines(data.prior.nonCurrentAssets) : undefined} />
                <Separator />
                <ComparativeTotalRow label="Total Assets" current={data.totalAssets} prior={data.prior?.totalAssets} />
              </CardContent>
            </Card>

            {/* LIABILITIES + EQUITY */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Liabilities &amp; Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BSSection title="Current Liabilities"     lines={data.currentLiabilities}    total={sumLines(data.currentLiabilities)}    priorLines={data.prior?.currentLiabilities}    priorTotal={data.prior ? sumLines(data.prior.currentLiabilities) : undefined} />
                <BSSection title="Non-Current Liabilities" lines={data.nonCurrentLiabilities} total={sumLines(data.nonCurrentLiabilities)} priorLines={data.prior?.nonCurrentLiabilities} priorTotal={data.prior ? sumLines(data.prior.nonCurrentLiabilities) : undefined} />
                <ComparativeTotalRow label="Total Liabilities" current={data.totalLiabilities} prior={data.prior?.totalLiabilities} sub />

                <Separator />

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equity</p>
                  <div className="space-y-1">
                    {data.equity.map((l) => {
                      const pl = data.prior?.equity.find(e => e.code === l.code);
                      return <BSLineRow key={l.code} line={l} priorLine={pl} />;
                    })}
                    <div className="flex justify-between items-center text-sm py-0.5 px-2">
                      <span className="text-muted-foreground">Retained Earnings (net income)</span>
                      <div className="flex items-center gap-2">
                        {hasPrior && (
                          <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">
                            {data.prior ? fmt(data.prior.retainedNetIncome) : "—"}
                          </span>
                        )}
                        <span className={`font-mono tabular-nums w-28 text-right ${data.retainedNetIncome < 0 ? "text-destructive" : ""}`}>
                          {fmt(data.retainedNetIncome)}
                        </span>
                        {hasPrior && <span className="w-24" />}
                      </div>
                    </div>
                  </div>
                </div>
                <ComparativeTotalRow label="Total Equity" current={data.totalEquity} prior={data.prior?.totalEquity} sub />

                <Separator />
                <ComparativeTotalRow label="Total Liabilities + Equity" current={data.totalLiabEquity} prior={data.prior?.totalLiabEquity} />
              </CardContent>
            </Card>
          </div>

          {/* Comparative summary strip */}
          {hasPrior && data.prior && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Period Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 font-medium">Item</th>
                        <th className="text-right py-2 font-medium w-36">{fmtDate(data.prior.asOf)}</th>
                        <th className="text-right py-2 font-medium w-36">{fmtDate(data.asOf)}</th>
                        <th className="text-right py-2 font-medium w-28">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Total Assets",              cur: data.totalAssets,      pri: data.prior.totalAssets },
                        { label: "Total Liabilities",         cur: data.totalLiabilities, pri: data.prior.totalLiabilities },
                        { label: "Total Equity",              cur: data.totalEquity,      pri: data.prior.totalEquity },
                        { label: "Retained Earnings (net)",   cur: data.retainedNetIncome, pri: data.prior.retainedNetIncome },
                      ].map(({ label, cur, pri }) => {
                        const diff = cur - pri;
                        return (
                          <tr key={label} className="border-b border-border/50">
                            <td className="py-2 text-muted-foreground">{label}</td>
                            <td className="py-2 text-right font-mono text-xs">{fmt(pri)}</td>
                            <td className="py-2 text-right font-mono">{fmt(cur)}</td>
                            <td className={`py-2 text-right font-mono text-xs ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                              {diff > 0 ? "+" : ""}{fmt(diff)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function BSSection({
  title, lines, total, priorLines, priorTotal,
}: {
  title: string; lines: BSLine[]; total: number;
  priorLines?: BSLine[]; priorTotal?: number;
}) {
  if (lines.length === 0 && (!priorLines || priorLines.length === 0)) return null;
  const hasPrior = priorLines !== undefined;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-0.5">
        {lines.map((l) => {
          const pl = priorLines?.find(p => p.code === l.code);
          return <BSLineRow key={l.code} line={l} priorLine={pl} />;
        })}
        <div className="flex justify-between items-center text-sm font-medium border-t pt-1.5 mt-1 px-2">
          <span>Total {title}</span>
          <div className="flex items-center gap-2">
            {hasPrior && (
              <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">
                {priorTotal !== undefined ? fmt(priorTotal) : "—"}
              </span>
            )}
            <span className="font-mono tabular-nums w-28 text-right">{fmt(total)}</span>
            {hasPrior && <span className="w-24" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function BSLineRow({ line, priorLine }: { line: BSLine; priorLine?: BSLine }) {
  const hasPrior = priorLine !== undefined;
  return (
    <div className="flex justify-between items-center text-sm py-0.5 px-2 rounded hover:bg-secondary/50">
      <div className="flex items-center gap-1.5 text-muted-foreground flex-1 min-w-0">
        <span className="font-mono text-xs shrink-0">{line.code}</span>
        <span className="truncate">{line.name}</span>
        {line.isContra && <Badge variant="outline" className="text-xs py-0 px-1 shrink-0">contra</Badge>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasPrior && (
          <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">
            {priorLine ? (priorLine.isContra ? `(${fmt(priorLine.amount)})` : fmt(priorLine.amount)) : "—"}
          </span>
        )}
        <span className={`font-mono tabular-nums w-28 text-right ${line.isContra ? "text-muted-foreground" : ""}`}>
          {line.isContra ? `(${fmt(line.amount)})` : fmt(line.amount)}
        </span>
        {hasPrior && <span className="w-24" />}
      </div>
    </div>
  );
}

function ComparativeTotalRow({ label, current, prior, sub }: { label: string; current: number; prior?: number; sub?: boolean }) {
  const diff = prior !== undefined ? current - prior : null;
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-md ${sub ? "bg-secondary/50" : "bg-secondary"}`}>
      <span className={`text-sm ${sub ? "font-medium" : "font-bold"}`}>{label}</span>
      <div className="flex items-center gap-2">
        {prior !== undefined && (
          <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">{fmt(prior)}</span>
        )}
        <span className={`font-mono tabular-nums text-sm w-28 text-right ${sub ? "font-medium" : "font-bold"} ${current < 0 ? "text-destructive" : ""}`}>
          {fmt(current)}
        </span>
        {diff !== null && (
          <span className={`font-mono tabular-nums text-xs w-24 text-right ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {diff > 0 ? "+" : ""}{fmt(diff)}
          </span>
        )}
      </div>
    </div>
  );
}
