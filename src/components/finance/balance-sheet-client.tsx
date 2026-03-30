"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle } from "lucide-react";
import type { BalanceSheet, BSLine } from "@/lib/actions/accounting/statements";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface Props {
  data: BalanceSheet | null;
  asOf: string;
}

export function BalanceSheetClient({ data, asOf }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = fd.get("asOf") as string;
    router.push(`${pathname}?asOf=${d}`);
  }

  const sumLines = (lines: BSLine[]) =>
    lines.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="asOf" className="text-xs">As of</Label>
              <Input id="asOf" name="asOf" type="date" defaultValue={asOf} className="h-8 text-sm w-40" />
            </div>
            <Button type="submit" size="sm">Apply</Button>
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
          {/* Balanced indicator */}
          <div className="flex items-center gap-2 text-sm">
            {data.balanced ? (
              <><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-emerald-600 font-medium">Balanced</span></>
            ) : (
              <><XCircle className="h-4 w-4 text-destructive" /><span className="text-destructive font-medium">Out of balance — check journal entries</span></>
            )}
            <span className="text-muted-foreground text-xs ml-1">
              as of {new Date(data.asOf).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ASSETS */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BSSection title="Current Assets" lines={data.currentAssets} total={sumLines(data.currentAssets)} />
                <BSSection title="Non-Current Assets" lines={data.nonCurrentAssets} total={sumLines(data.nonCurrentAssets)} />
                <Separator />
                <TotalRow label="Total Assets" amount={data.totalAssets} />
              </CardContent>
            </Card>

            {/* LIABILITIES + EQUITY */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Liabilities &amp; Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BSSection title="Current Liabilities" lines={data.currentLiabilities} total={sumLines(data.currentLiabilities)} />
                <BSSection title="Non-Current Liabilities" lines={data.nonCurrentLiabilities} total={sumLines(data.nonCurrentLiabilities)} />
                <TotalRow label="Total Liabilities" amount={data.totalLiabilities} sub />

                <Separator />

                {/* Equity */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equity</p>
                  <div className="space-y-1">
                    {data.equity.map((l) => (
                      <BSLineRow key={l.code} line={l} />
                    ))}
                    <div className="flex justify-between items-center text-sm py-0.5 px-2">
                      <span className="text-muted-foreground">Retained Earnings (net income)</span>
                      <span className={`font-mono tabular-nums ${data.retainedNetIncome < 0 ? "text-destructive" : ""}`}>
                        {fmt(data.retainedNetIncome)}
                      </span>
                    </div>
                  </div>
                </div>
                <TotalRow label="Total Equity" amount={data.totalEquity} sub />

                <Separator />
                <TotalRow label="Total Liabilities + Equity" amount={data.totalLiabEquity} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function BSSection({ title, lines, total }: { title: string; lines: BSLine[]; total: number }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-0.5">
        {lines.map((l) => (
          <BSLineRow key={l.code} line={l} />
        ))}
        <div className="flex justify-between items-center text-sm font-medium border-t pt-1.5 mt-1 px-2">
          <span>Total {title}</span>
          <span className="font-mono tabular-nums">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

function BSLineRow({ line }: { line: BSLine }) {
  return (
    <div className="flex justify-between items-center text-sm py-0.5 px-2 rounded hover:bg-secondary/50">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="font-mono text-xs">{line.code}</span>
        <span>{line.name}</span>
        {line.isContra && <Badge variant="outline" className="text-xs py-0 px-1">contra</Badge>}
      </div>
      <span className={`font-mono tabular-nums ${line.isContra ? "text-muted-foreground" : ""}`}>
        {line.isContra ? `(${fmt(line.amount)})` : fmt(line.amount)}
      </span>
    </div>
  );
}

function TotalRow({ label, amount, sub }: { label: string; amount: number; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-md ${sub ? "bg-secondary/50" : "bg-secondary"}`}>
      <span className={`text-sm ${sub ? "font-medium" : "font-bold"}`}>{label}</span>
      <span className={`font-mono tabular-nums text-sm ${sub ? "font-medium" : "font-bold"} ${amount < 0 ? "text-destructive" : ""}`}>
        {fmt(amount)}
      </span>
    </div>
  );
}
