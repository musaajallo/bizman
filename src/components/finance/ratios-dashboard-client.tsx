"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  ReferenceLine,
} from "recharts";
import type { FinancialRatiosData, Ratio } from "@/lib/actions/accounting/ratios";

// ── Serialised version (Dates → strings) ─────────────────────────────────────

type SerializedRatiosData = Omit<FinancialRatiosData, "asOf" | "ytdStart"> & {
  asOf:     string;
  ytdStart: string;
};

// ── Ratio metadata: labels, units, explanations ───────────────────────────────

type RatioMeta = {
  label:       string;
  unit:        "x" | "%" | "days" | "";
  description: string;
  interpret:   string;
};

const RATIO_META: Record<string, RatioMeta> = {
  currentRatio: {
    label: "Current Ratio",
    unit:  "x",
    description: "Current Assets ÷ Current Liabilities",
    interpret:   "Measures ability to pay short-term obligations. ≥1.5 is healthy; <1 signals potential liquidity stress.",
  },
  quickRatio: {
    label: "Quick Ratio",
    unit:  "x",
    description: "( Cash + AR ) ÷ Current Liabilities",
    interpret:   "Like the current ratio but excludes inventory. ≥1.0 means the business can cover current liabilities without selling stock.",
  },
  cashRatio: {
    label: "Cash Ratio",
    unit:  "x",
    description: "Cash & Equivalents ÷ Current Liabilities",
    interpret:   "The most conservative liquidity measure — only cash counts. ≥0.5 is generally adequate.",
  },
  grossMargin: {
    label: "Gross Margin",
    unit:  "%",
    description: "( Revenue − COGS ) ÷ Revenue × 100",
    interpret:   "Percentage of revenue retained after direct costs. Higher is better; benchmarks vary widely by industry.",
  },
  operatingMargin: {
    label: "Operating Margin",
    unit:  "%",
    description: "Operating Income ÷ Revenue × 100",
    interpret:   "Profit after operating expenses but before interest & tax. Reflects operational efficiency.",
  },
  netMargin: {
    label: "Net Margin",
    unit:  "%",
    description: "Net Income ÷ Revenue × 100",
    interpret:   "Bottom-line profitability. Includes all costs. Compare against industry peers for context.",
  },
  roa: {
    label: "Return on Assets",
    unit:  "%",
    description: "Net Income ÷ Total Assets × 100",
    interpret:   "How efficiently assets generate profit. ≥5% is broadly healthy; capital-intensive industries run lower.",
  },
  roe: {
    label: "Return on Equity",
    unit:  "%",
    description: "Net Income ÷ Total Equity × 100",
    interpret:   "Return generated for shareholders. ≥10–15% is generally considered good.",
  },
  dso: {
    label: "Days Sales Outstanding",
    unit:  "days",
    description: "( AR ÷ Annualised Revenue ) × 365",
    interpret:   "Average days to collect payment. Lower is better — high DSO means cash is tied up in receivables.",
  },
  dpo: {
    label: "Days Payable Outstanding",
    unit:  "days",
    description: "( AP ÷ Annualised COGS ) × 365",
    interpret:   "Average days taken to pay suppliers. Higher can improve cash flow but strains supplier relationships.",
  },
  dio: {
    label: "Days Inventory Outstanding",
    unit:  "days",
    description: "( Inventory ÷ Annualised COGS ) × 365",
    interpret:   "Average days inventory is held before sale. Lower means faster stock turns.",
  },
  ccc: {
    label: "Cash Conversion Cycle",
    unit:  "days",
    description: "DSO + DIO − DPO",
    interpret:   "Days between paying for inputs and receiving cash from sales. Lower (or negative) is better — it means the business collects before it has to pay.",
  },
  debtToEquity: {
    label: "Debt-to-Equity",
    unit:  "x",
    description: "Total Liabilities ÷ Total Equity",
    interpret:   "Financial leverage. <1 means more equity than debt. >2 signals high leverage; <1 is conservative.",
  },
  debtRatio: {
    label: "Debt Ratio",
    unit:  "",
    description: "Total Liabilities ÷ Total Assets",
    interpret:   "Proportion of assets financed by debt. <0.5 is conservative; >0.7 is highly leveraged.",
  },
  interestCoverage: {
    label: "Interest Coverage",
    unit:  "x",
    description: "Operating Income ÷ Interest Expense",
    interpret:   "How many times operating income covers interest payments. ≥3× is healthy; <1.5× signals distress.",
  },
};

// ── Benchmark status ──────────────────────────────────────────────────────────

type Status = "good" | "warn" | "bad" | "na";

function getStatus(ratio: Ratio): Status {
  const v = ratio.current;
  if (v === null) return "na";
  const { low, high, direction } = ratio.benchmark;
  if (direction === "higher") {
    if (v >= high) return "good";
    if (v >= low)  return "warn";
    return "bad";
  } else {
    if (v <= low)  return "good";
    if (v <= high) return "warn";
    return "bad";
  }
}

const STATUS_COLORS: Record<Status, string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  bad:  "text-red-400",
  na:   "text-muted-foreground",
};

const STATUS_BG: Record<Status, string> = {
  good: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  warn: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  bad:  "bg-red-500/10 border-red-500/20 text-red-400",
  na:   "bg-secondary/40 border-border text-muted-foreground",
};

const STATUS_LABELS: Record<Status, string> = {
  good: "On target",
  warn: "Watch",
  bad:  "Below target",
  na:   "N/A",
};

// ── Formatting ────────────────────────────────────────────────────────────────

function fmtValue(v: number | null, unit: RatioMeta["unit"]): string {
  if (v === null) return "—";
  if (unit === "%")    return `${v.toFixed(1)}%`;
  if (unit === "x")    return `${v.toFixed(2)}x`;
  if (unit === "days") return `${Math.round(v)}d`;
  return v.toFixed(2);
}

// ── Trend direction ───────────────────────────────────────────────────────────

function getTrend(history: Ratio["history"]): "up" | "down" | "flat" {
  const vals = history.map((h) => h.value).filter((v): v is number => v !== null);
  if (vals.length < 2) return "flat";
  const delta = vals[vals.length - 1] - vals[vals.length - 4 < 0 ? 0 : vals.length - 4];
  if (Math.abs(delta) < 0.001 * Math.abs(vals[vals.length - 1] || 1)) return "flat";
  return delta > 0 ? "up" : "down";
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ history, status }: { history: Ratio["history"]; status: Status }) {
  const data = history.map((h) => ({ v: h.value, label: h.label }));
  const color = status === "good" ? "#4ade80" : status === "warn" ? "#fbbf24" : status === "bad" ? "#f87171" : "#71717a";

  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          connectNulls
        />
        <RechartTooltip
          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 4, fontSize: 10, padding: "3px 8px" }}
          formatter={(v: unknown) => [v !== null ? String(Number(v).toFixed(2)) : "—", ""]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Ratio card ────────────────────────────────────────────────────────────────

function RatioCard({ ratioKey, ratio }: { ratioKey: string; ratio: Ratio }) {
  const meta   = RATIO_META[ratioKey];
  const status = getStatus(ratio);
  const trend  = getTrend(ratio.history);

  if (!meta) return null;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = (() => {
    if (trend === "flat") return "text-muted-foreground";
    const dir = ratio.benchmark.direction;
    const good = (dir === "higher" && trend === "up") || (dir === "lower" && trend === "down");
    return good ? "text-emerald-400" : "text-red-400";
  })();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-1 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">{meta.label}</CardTitle>
            <Tooltip>
              <TooltipTrigger className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
                <p className="font-medium text-foreground">{meta.label}</p>
                <p className="text-muted-foreground font-mono">{meta.description}</p>
                <p>{meta.interpret}</p>
                <p className="text-muted-foreground">
                  Target: {ratio.benchmark.direction === "higher" ? "≥" : "≤"}{ratio.benchmark.low}
                  {meta.unit} ({ratio.benchmark.direction === "higher" ? "higher" : "lower"} is better)
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 px-1.5 py-0 ${STATUS_BG[status]}`}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 flex flex-col">
        <div className="flex items-end justify-between gap-2 mb-1">
          <span className={`text-2xl font-bold font-mono ${STATUS_COLORS[status]}`}>
            {fmtValue(ratio.current, meta.unit)}
          </span>
          <div className={`flex items-center gap-0.5 text-xs ${trendColor} mb-1`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-[10px]">3m</span>
          </div>
        </div>

        {/* Benchmark bar */}
        <div className="text-[10px] text-muted-foreground flex justify-between mb-1">
          <span>{ratio.benchmark.direction === "higher" ? "Low" : "Good"}: {ratio.benchmark.low}{meta.unit}</span>
          <span>{ratio.benchmark.direction === "higher" ? "Good" : "High"}: {ratio.benchmark.high}{meta.unit}</span>
        </div>

        {/* Sparkline */}
        <div className="mt-auto -mx-1">
          <Sparkline history={ratio.history} status={status} />
        </div>
        <p className="text-[10px] text-muted-foreground text-center -mt-1">12-month trend</p>
      </CardContent>
    </Card>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function RatioSection({
  title,
  subtitle,
  ratios,
}: {
  title: string;
  subtitle: string;
  ratios: Array<{ key: string; ratio: Ratio }>;
}) {
  const statuses = ratios.map(({ ratio }) => getStatus(ratio));
  const goodCount = statuses.filter((s) => s === "good").length;
  const badCount  = statuses.filter((s) => s === "bad").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {goodCount > 0 && (
            <span className="text-emerald-400">{goodCount} on target</span>
          )}
          {badCount > 0 && (
            <span className="text-red-400">{badCount} below target</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ratios.map(({ key, ratio }) => (
          <RatioCard key={key} ratioKey={key} ratio={ratio} />
        ))}
      </div>
    </div>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: SerializedRatiosData }) {
  const allRatios: Array<{ key: string; ratio: Ratio }> = [
    { key: "currentRatio",    ratio: data.currentRatio },
    { key: "quickRatio",      ratio: data.quickRatio },
    { key: "cashRatio",       ratio: data.cashRatio },
    { key: "grossMargin",     ratio: data.grossMargin },
    { key: "operatingMargin", ratio: data.operatingMargin },
    { key: "netMargin",       ratio: data.netMargin },
    { key: "roa",             ratio: data.roa },
    { key: "roe",             ratio: data.roe },
    { key: "dso",             ratio: data.dso },
    { key: "dpo",             ratio: data.dpo },
    { key: "dio",             ratio: data.dio },
    { key: "ccc",             ratio: data.ccc },
    { key: "debtToEquity",    ratio: data.debtToEquity },
    { key: "debtRatio",       ratio: data.debtRatio },
    { key: "interestCoverage",ratio: data.interestCoverage },
  ];

  const statuses = allRatios.map(({ ratio }) => getStatus(ratio));
  const good = statuses.filter((s) => s === "good").length;
  const warn = statuses.filter((s) => s === "warn").length;
  const bad  = statuses.filter((s) => s === "bad").length;
  const na   = statuses.filter((s) => s === "na").length;
  const total = allRatios.length - na;

  const asOf = new Date(data.asOf).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const ytd = new Date(data.ytdStart).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="text-emerald-400 font-mono font-semibold">{good}</span>
          <span className="text-muted-foreground text-xs">on target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-amber-400 font-mono font-semibold">{warn}</span>
          <span className="text-muted-foreground text-xs">watch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span className="text-red-400 font-mono font-semibold">{bad}</span>
          <span className="text-muted-foreground text-xs">below target</span>
        </div>
        {na > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
            <span className="text-muted-foreground font-mono font-semibold">{na}</span>
            <span className="text-muted-foreground text-xs">n/a</span>
          </div>
        )}
      </div>

      {/* Health bar */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-32 rounded-full overflow-hidden bg-secondary">
            <div className="bg-emerald-400 h-full" style={{ width: `${(good / total) * 100}%` }} />
            <div className="bg-amber-400 h-full"   style={{ width: `${(warn / total) * 100}%` }} />
            <div className="bg-red-400 h-full"     style={{ width: `${(bad  / total) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{Math.round((good / total) * 100)}% healthy</span>
        </div>
      )}

      <div className="ml-auto text-xs text-muted-foreground">
        As of {asOf} · YTD from {ytd}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RatiosDashboardClient({ data }: { data: SerializedRatiosData }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  void expandedSection; void setExpandedSection; // future use

  const sections = [
    {
      key: "liquidity",
      title: "Liquidity",
      subtitle: "Ability to meet short-term obligations",
      ratios: [
        { key: "currentRatio", ratio: data.currentRatio },
        { key: "quickRatio",   ratio: data.quickRatio },
        { key: "cashRatio",    ratio: data.cashRatio },
      ],
    },
    {
      key: "profitability",
      title: "Profitability",
      subtitle: "YTD — revenue quality and return generation",
      ratios: [
        { key: "grossMargin",      ratio: data.grossMargin },
        { key: "operatingMargin",  ratio: data.operatingMargin },
        { key: "netMargin",        ratio: data.netMargin },
        { key: "roa",              ratio: data.roa },
        { key: "roe",              ratio: data.roe },
      ],
    },
    {
      key: "efficiency",
      title: "Efficiency",
      subtitle: "Working capital management — YTD annualised",
      ratios: [
        { key: "dso", ratio: data.dso },
        { key: "dpo", ratio: data.dpo },
        { key: "dio", ratio: data.dio },
        { key: "ccc", ratio: data.ccc },
      ],
    },
    {
      key: "solvency",
      title: "Solvency",
      subtitle: "Long-term financial stability and leverage",
      ratios: [
        { key: "debtToEquity",    ratio: data.debtToEquity },
        { key: "debtRatio",       ratio: data.debtRatio },
        { key: "interestCoverage",ratio: data.interestCoverage },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <SummaryStrip data={data} />
      {sections.map((s) => (
        <RatioSection key={s.key} title={s.title} subtitle={s.subtitle} ratios={s.ratios} />
      ))}
    </div>
  );
}
