"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

type DashboardData = {
  ytdRevenue: number; ytdCoS: number; ytdExpenses: number; ytdNetIncome: number;
  ytdGrossMargin: number; ytdNetMargin: number;
  cash: number;
  mRevenue: number; mExpenses: number; mNetIncome: number;
};

interface Props { data: DashboardData | null }

export function ForecastingClient({ data }: Props) {
  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground py-12">
          No accounting data available. Initialize accounting first.
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  // Days elapsed in the year
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysElapsed = Math.max(1, Math.round((now.getTime() - startOfYear.getTime()) / 86400000));
  const daysInYear = now.getFullYear() % 4 === 0 ? 366 : 365;
  const progressPct = (daysElapsed / daysInYear) * 100;

  // Full-year projections
  const projRevenue   = data.ytdRevenue   > 0 ? (data.ytdRevenue   / daysElapsed) * daysInYear : 0;
  const projCoS       = data.ytdCoS       > 0 ? (data.ytdCoS       / daysElapsed) * daysInYear : 0;
  const projExpenses  = data.ytdExpenses  > 0 ? (data.ytdExpenses  / daysElapsed) * daysInYear : 0;
  const projNetIncome = projRevenue - projCoS - projExpenses;
  const projGrossMargin = projRevenue > 0 ? ((projRevenue - projCoS) / projRevenue) * 100 : 0;
  const projNetMargin   = projRevenue > 0 ? (projNetIncome / projRevenue) * 100 : 0;

  const monthsElapsed = now.getMonth() + 1; // 1–12
  const projMonthlyRevenue  = projRevenue  / 12;
  const projMonthlyExpenses = (projCoS + projExpenses) / 12;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md bg-secondary">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Projections are linear extrapolations from YTD actuals ({daysElapsed} of {daysInYear} days elapsed,{" "}
          {progressPct.toFixed(0)}% through {now.getFullYear()}). Actual results may vary.
        </span>
      </div>

      {/* Full-year projection cards */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Full-Year Projections ({now.getFullYear()})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ProjCard title="Revenue" ytd={data.ytdRevenue} projected={projRevenue} />
          <ProjCard title="Cost of Sales" ytd={data.ytdCoS} projected={projCoS} neutral />
          <ProjCard title="Operating Expenses" ytd={data.ytdExpenses} projected={projExpenses} neutral />
          <ProjCard title="Net Income" ytd={data.ytdNetIncome} projected={projNetIncome} />
          <div className="col-span-1 sm:col-span-1">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Gross Margin</p>
                <p className="text-xl font-bold">{projGrossMargin.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">YTD: {data.ytdGrossMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1 sm:col-span-1">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Net Margin</p>
                <p className={`text-xl font-bold ${projNetMargin < 0 ? "text-destructive" : ""}`}>{projNetMargin.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">YTD: {data.ytdNetMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Monthly projection table */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Monthly Projection</h2>
        <Card>
          <CardContent className="pt-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Month</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Expenses</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Net Income</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHS.map((month, idx) => {
                    const isPast    = idx < monthsElapsed - 1;
                    const isCurrent = idx === monthsElapsed - 1;
                    // For past months use monthly actual run rate from YTD / months elapsed
                    const rev  = isPast || isCurrent ? data.ytdRevenue  / monthsElapsed : projMonthlyRevenue;
                    const exp  = isPast || isCurrent ? (data.ytdCoS + data.ytdExpenses) / monthsElapsed : projMonthlyExpenses;
                    const net  = rev - exp;

                    return (
                      <tr key={month} className={`border-b last:border-0 ${isCurrent ? "bg-secondary/50" : ""}`}>
                        <td className="py-2.5 px-4 font-medium">
                          {month} {now.getFullYear()}
                          {isCurrent && <Badge variant="outline" className="ml-2 text-xs py-0">current</Badge>}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground">
                          {fmt(rev)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground">
                          {fmt(exp)}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono tabular-nums font-medium ${net < 0 ? "text-destructive" : "text-emerald-600"}`}>
                          {net >= 0 ? "+" : ""}{fmt(net)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isPast ? (
                            <Badge variant="secondary" className="text-xs">actual avg</Badge>
                          ) : isCurrent ? (
                            <Badge variant="default" className="text-xs">in progress</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">projected</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-secondary font-bold">
                    <td className="py-3 px-4">Full Year Total</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{fmt(projRevenue)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{fmt(projCoS + projExpenses)}</td>
                    <td className={`py-3 px-4 text-right font-mono tabular-nums ${projNetIncome < 0 ? "text-destructive" : ""}`}>{fmt(projNetIncome)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ProjCard({
  title, ytd, projected, neutral,
}: {
  title: string; ytd: number; projected: number; neutral?: boolean;
}) {
  const diff    = projected - ytd;
  const isNeg   = projected < 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className={`text-xl font-bold font-mono ${!neutral && isNeg ? "text-destructive" : ""}`}>{fmt(projected)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">YTD: {fmt(ytd)}</p>
      </CardContent>
    </Card>
  );
}
