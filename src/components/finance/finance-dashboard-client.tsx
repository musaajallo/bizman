"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Package, AlertCircle } from "lucide-react";

function fmt(n: number, dp = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(n);
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

type DashboardData = {
  mRevenue: number; mExpenses: number; mNetIncome: number;
  ytdRevenue: number; ytdCoS: number; ytdExpenses: number; ytdNetIncome: number;
  ytdGrossMargin: number; ytdNetMargin: number;
  cash: number; ar: number; ap: number; inventory: number;
  currentRatio: number | null; quickRatio: number | null;
  arBalance: number; arOver30: number;
};

interface Props { data: DashboardData | null }

export function FinanceDashboardClient({ data }: Props) {
  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          No accounting data available. Initialize accounting to see financial metrics.
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Monthly KPIs */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{monthLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Revenue"
            value={fmt(data.mRevenue)}
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            positive={data.mRevenue >= 0}
          />
          <KpiCard
            title="Expenses"
            value={fmt(data.mExpenses)}
            icon={<CreditCard className="h-4 w-4 text-orange-500" />}
            positive={false}
            neutral
          />
          <KpiCard
            title="Net Income"
            value={fmt(data.mNetIncome)}
            icon={data.mNetIncome >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            positive={data.mNetIncome >= 0}
          />
        </div>
      </section>

      {/* YTD */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Year to Date</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard title="YTD Revenue" value={fmt(data.ytdRevenue)} positive={data.ytdRevenue >= 0} />
          <KpiCard
            title="YTD Net Income"
            value={fmt(data.ytdNetIncome)}
            sub={pct(data.ytdNetMargin) + " margin"}
            positive={data.ytdNetIncome >= 0}
          />
          <KpiCard
            title="Gross Margin"
            value={`${data.ytdGrossMargin.toFixed(1)}%`}
            sub={`CoS: ${fmt(data.ytdCoS)}`}
            positive={data.ytdGrossMargin >= 40}
          />
        </div>
      </section>

      <Separator />

      {/* Balance Sheet Snapshot */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Balance Sheet Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            title="Cash"
            value={fmt(data.cash)}
            icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
            positive={data.cash >= 0}
          />
          <KpiCard
            title="Accounts Receivable"
            value={fmt(data.ar)}
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            positive={true}
          />
          <KpiCard
            title="Accounts Payable"
            value={fmt(data.ap)}
            icon={<CreditCard className="h-4 w-4 text-orange-500" />}
            positive={false}
            neutral
          />
          <KpiCard
            title="Inventory"
            value={fmt(data.inventory)}
            icon={<Package className="h-4 w-4 text-violet-500" />}
            positive={true}
          />
        </div>
      </section>

      {/* Ratios + AR Aging */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Liquidity Ratios */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Liquidity Ratios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RatioRow
                label="Current Ratio"
                value={data.currentRatio}
                goodAbove={1.5}
                warnAbove={1.0}
                tooltip="Current Assets / Current Liabilities"
              />
              <RatioRow
                label="Quick Ratio"
                value={data.quickRatio}
                goodAbove={1.0}
                warnAbove={0.7}
                tooltip="(Cash + AR) / Current Liabilities"
              />
            </CardContent>
          </Card>

          {/* AR Aging */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AR Aging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total AR Balance</span>
                <span className="font-mono font-medium">{fmt(data.arBalance, 2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {data.arOver30 > 0 && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                  <span>Over 30 Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{fmt(data.arOver30, 2)}</span>
                  {data.arOver30 > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      {data.arBalance > 0 ? `${((data.arOver30 / data.arBalance) * 100).toFixed(0)}%` : "—"}
                    </Badge>
                  )}
                </div>
              </div>
              {data.arOver30 > 0 && (
                <p className="text-xs text-muted-foreground">
                  Some invoices are overdue. Review AR and follow up with clients.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title, value, sub, icon, positive, neutral,
}: {
  title: string; value: string; sub?: string;
  icon?: React.ReactNode; positive: boolean; neutral?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          {icon}
        </div>
        <p className={`text-xl font-bold font-mono ${neutral ? "" : positive ? "text-foreground" : "text-destructive"}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function RatioRow({
  label, value, goodAbove, warnAbove,
}: {
  label: string; value: number | null; goodAbove: number; warnAbove: number; tooltip?: string;
}) {
  const display = value === null ? "N/A" : value.toFixed(2);
  const color =
    value === null ? "text-muted-foreground"
    : value >= goodAbove ? "text-emerald-600"
    : value >= warnAbove ? "text-amber-600"
    : "text-destructive";

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{display}</span>
    </div>
  );
}
