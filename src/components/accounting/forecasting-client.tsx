"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, Download, FileText, Plus, Pencil, Trash2,
  RefreshCw, AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  upsertScenario,
  deleteScenario,
  type ForecastData,
  type ScenarioForecast,
  type MonthlyOverride,
} from "@/lib/actions/accounting/forecasting";

// ── Formatting ────────────────────────────────────────────────────────────────

function fmt(n: number, compact = false) {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Colour constants ──────────────────────────────────────────────────────────

const C_REV   = "#4ade80";
const C_EXP   = "#f87171";
const C_NET   = "#818cf8";
const C_CUM   = "#fbbf24";
const C_REC   = "#34d399";
const C_PIPE  = "#60a5fa";
const C_TREND = "#a78bfa";
const C_BILLS = "#fb923c";
const C_PAY   = "#f472b6";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold font-mono mt-1 ${positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : ""}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Scenario badge ────────────────────────────────────────────────────────────

const SCENARIO_COLORS: Record<string, string> = {
  base:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  optimistic:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pessimistic: "bg-red-500/10 text-red-400 border-red-500/20",
  custom:      "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  data: ForecastData;
}

export function ForecastingClient({ data }: Props) {
  const [activeScenario, setActiveScenario] = useState(data.scenarios[0]?.scenarioName ?? "Base");

  const scenario = data.scenarios.find((s) => s.scenarioName === activeScenario) ?? data.scenarios[0];

  return (
    <div className="space-y-5">
      {/* Scenario selector */}
      <div className="flex flex-wrap items-center gap-2">
        {data.scenarios.map((s) => (
          <button
            key={s.scenarioName}
            onClick={() => setActiveScenario(s.scenarioName)}
            className="focus:outline-none"
          >
            <Badge
              variant="outline"
              className={`text-xs cursor-pointer transition-opacity px-3 py-1 ${SCENARIO_COLORS[s.scenarioType] ?? SCENARIO_COLORS.custom} ${activeScenario === s.scenarioName ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-80"}`}
            >
              {s.scenarioName}
              {s.scenarioType !== "base" && (
                <span className="ml-1 text-[10px] opacity-70">
                  rev×{s.revenueMultiplier.toFixed(1)} exp×{s.expenseMultiplier.toFixed(1)}
                </span>
              )}
            </Badge>
          </button>
        ))}
        <a
          href={`/api/accounting/forecast/pdf?scenario=${encodeURIComponent(activeScenario)}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto"
        >
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />PDF
          </Button>
        </a>
      </div>

      <Tabs defaultValue="cashflow">
        <TabsList>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="mt-4 space-y-4">
          <CashFlowTab scenario={scenario} startingCash={data.startingCash} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <RevenueTab scenario={scenario} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-4">
          <ExpensesTab scenario={scenario} />
        </TabsContent>

        <TabsContent value="scenarios" className="mt-4 space-y-4">
          <ScenariosTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────────────────────

function CashFlowTab({ scenario, startingCash }: { scenario: ScenarioForecast; startingCash: number }) {
  const chartData = scenario.months.map((m) => ({
    label:       m.label.slice(0, 6),
    "Inflows":   Math.round(m.totalRevenue),
    "Outflows":  Math.round(m.totalExpenses),
    "Net Cash":  Math.round(m.netCashFlow),
    "Cumulative":Math.round(m.cumulativeCash),
  }));

  const ending = scenario.endingCashPosition;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Starting Cash"   value={fmt(startingCash)} />
        <StatCard label="Total Inflows"   value={fmt(scenario.totalRevenue)}  positive={true} />
        <StatCard label="Total Outflows"  value={fmt(scenario.totalExpenses)} positive={false} />
        <StatCard
          label="Ending Position"
          value={fmt(ending)}
          positive={ending >= 0}
          sub={ending >= startingCash ? `↑ ${fmt(ending - startingCash)} from today` : `↓ ${fmt(startingCash - ending)} from today`}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">12-Month Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => fmt(v, true)} width={52} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#f3f4f6", marginBottom: 4 }}
                formatter={(v: unknown) => fmt(Number(v ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Inflows"  fill={C_REV} radius={[2, 2, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Outflows" fill={C_EXP} radius={[2, 2, 0, 0]} maxBarSize={28} />
              <Line dataKey="Cumulative" type="monotone" stroke={C_CUM} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-right text-xs text-emerald-400">Inflows</TableHead>
                <TableHead className="text-right text-xs text-red-400">Outflows</TableHead>
                <TableHead className="text-right text-xs">Net Cash</TableHead>
                <TableHead className="text-right text-xs">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenario.months.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="text-sm">{m.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-400">{fmt(m.totalRevenue)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-400">{fmt(m.totalExpenses)}</TableCell>
                  <TableCell className={`text-right font-mono text-sm ${m.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {m.netCashFlow >= 0 ? "+" : ""}{fmt(m.netCashFlow)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.cumulativeCash)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

// ── Revenue Tab ───────────────────────────────────────────────────────────────

function RevenueTab({ scenario }: { scenario: ScenarioForecast }) {
  const chartData = scenario.months.map((m) => ({
    label:      m.label.slice(0, 6),
    Recurring:  Math.round(m.recurringRevenue),
    Pipeline:   Math.round(m.pipelineRevenue),
    Trend:      Math.round(m.trendRevenue),
    ...(m.actualRevenue != null ? { Actual: Math.round(m.actualRevenue) } : {}),
  }));

  const totalRec  = scenario.months.reduce((s, m) => s + m.recurringRevenue, 0);
  const totalPipe = scenario.months.reduce((s, m) => s + m.pipelineRevenue, 0);
  const totalTrend= scenario.months.reduce((s, m) => s + m.trendRevenue, 0);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Forecast Revenue" value={fmt(scenario.totalRevenue)} positive={true} />
        <StatCard label="Recurring Invoices"      value={fmt(totalRec)} />
        <StatCard label="Pipeline Projects"        value={fmt(totalPipe)} />
        <StatCard label="Trend Baseline"           value={fmt(totalTrend)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Revenue Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Recurring = scheduled invoices · Pipeline = active project budgets · Trend = historical baseline</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => fmt(v, true)} width={52} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                formatter={(v: unknown) => fmt(Number(v ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Recurring" stackId="a" fill={C_REC}   maxBarSize={32} />
              <Bar dataKey="Pipeline"  stackId="a" fill={C_PIPE}  maxBarSize={32} />
              <Bar dataKey="Trend"     stackId="a" fill={C_TREND} maxBarSize={32} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-right text-xs">Recurring</TableHead>
                <TableHead className="text-right text-xs">Pipeline</TableHead>
                <TableHead className="text-right text-xs">Trend</TableHead>
                <TableHead className="text-right text-xs text-emerald-400">Total</TableHead>
                {scenario.months.some((m) => m.actualRevenue != null) && (
                  <TableHead className="text-right text-xs text-muted-foreground">Actual</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenario.months.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="text-sm">{m.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.recurringRevenue)}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.pipelineRevenue)}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.trendRevenue)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-400">{fmt(m.totalRevenue)}</TableCell>
                  {scenario.months.some((mm) => mm.actualRevenue != null) && (
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {m.actualRevenue != null ? fmt(m.actualRevenue) : "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────

function ExpensesTab({ scenario }: { scenario: ScenarioForecast }) {
  const chartData = scenario.months.map((m) => ({
    label:    m.label.slice(0, 6),
    Bills:    Math.round(m.recurringBills),
    Payroll:  Math.round(m.payroll),
    Other:    Math.round(m.trendExpenses),
  }));

  const totalBills   = scenario.months.reduce((s, m) => s + m.recurringBills, 0);
  const totalPayroll = scenario.months.reduce((s, m) => s + m.payroll, 0);
  const totalOther   = scenario.months.reduce((s, m) => s + m.trendExpenses, 0);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Forecast Expenses" value={fmt(scenario.totalExpenses)} positive={false} />
        <StatCard label="Recurring Bills"          value={fmt(totalBills)} />
        <StatCard label="Payroll"                  value={fmt(totalPayroll)} />
        <StatCard label="Other / Trend"            value={fmt(totalOther)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Expense Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Bills = detected recurring vendor payments · Payroll = avg of last 3 runs · Other = historical trend baseline</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => fmt(v, true)} width={52} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                formatter={(v: unknown) => fmt(Number(v ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Bills"   stackId="a" fill={C_BILLS} maxBarSize={32} />
              <Bar dataKey="Payroll" stackId="a" fill={C_PAY}   maxBarSize={32} />
              <Bar dataKey="Other"   stackId="a" fill={C_EXP}   maxBarSize={32} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-right text-xs">Bills</TableHead>
                <TableHead className="text-right text-xs">Payroll</TableHead>
                <TableHead className="text-right text-xs">Other</TableHead>
                <TableHead className="text-right text-xs text-red-400">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenario.months.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="text-sm">{m.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.recurringBills)}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.payroll)}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">{fmt(m.trendExpenses)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-400">{fmt(m.totalExpenses)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

// ── Scenarios Tab ─────────────────────────────────────────────────────────────

function ScenariosTab({ data }: { data: ForecastData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default form state
  const [form, setForm] = useState({
    id:               "",
    name:             "",
    type:             "custom",
    revenueMultiplier:"1.00",
    expenseMultiplier:"1.00",
    overrides:        [] as MonthlyOverride[],
  });

  function openNew() {
    setForm({ id: "", name: "", type: "custom", revenueMultiplier: "1.00", expenseMultiplier: "1.00", overrides: [] });
    setEditOpen(true);
  }

  function openEdit(s: ScenarioForecast) {
    setForm({
      id:                s.scenarioId ?? "",
      name:              s.scenarioName,
      type:              s.scenarioType,
      revenueMultiplier: s.revenueMultiplier.toFixed(2),
      expenseMultiplier: s.expenseMultiplier.toFixed(2),
      overrides:         [],
    });
    setEditOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await upsertScenario({
        id:                form.id || undefined,
        name:              form.name,
        type:              form.type,
        revenueMultiplier: parseFloat(form.revenueMultiplier),
        expenseMultiplier: parseFloat(form.expenseMultiplier),
        monthlyOverrides:  form.overrides,
      });
      if (res.error) { setError(res.error); return; }
      setEditOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteScenario(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  // Comparison chart
  const chartData = data.scenarios[0]?.months.map((_, i) => {
    const point: Record<string, string | number> = { label: data.scenarios[0].months[i].label.slice(0, 6) };
    for (const s of data.scenarios) {
      point[s.scenarioName] = Math.round(s.months[i].cumulativeCash);
    }
    return point;
  }) ?? [];

  const lineColors = [C_NET, C_REV, C_EXP, C_CUM, C_PIPE];

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Scenario Comparison — Cumulative Cash Position</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => fmt(v, true)} width={52} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                formatter={(v: unknown) => fmt(Number(v ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.scenarios.map((s, i) => (
                <Line
                  key={s.scenarioName}
                  type="monotone"
                  dataKey={s.scenarioName}
                  stroke={lineColors[i % lineColors.length]}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray={s.scenarioType === "pessimistic" ? "4 3" : undefined}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.scenarios.map((s) => (
          <Card key={s.scenarioName} className={`border ${SCENARIO_COLORS[s.scenarioType]?.replace("bg-", "border-").replace("/10", "/30") ?? ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {s.scenarioName}
                  <Badge variant="outline" className={`text-[10px] ${SCENARIO_COLORS[s.scenarioType] ?? ""}`}>
                    {s.scenarioType}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {s.scenarioType === "custom" && s.scenarioId && (
                    <button onClick={() => setDeleteId(s.scenarioId!)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary/40 rounded p-2">
                  <p className="text-muted-foreground">Rev. multiplier</p>
                  <p className="font-mono font-semibold mt-0.5">{s.revenueMultiplier.toFixed(2)}×</p>
                </div>
                <div className="bg-secondary/40 rounded p-2">
                  <p className="text-muted-foreground">Exp. multiplier</p>
                  <p className="font-mono font-semibold mt-0.5">{s.expenseMultiplier.toFixed(2)}×</p>
                </div>
              </div>
              <div className="border-t border-border/40 pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">12m Revenue</span>
                  <span className="font-mono text-emerald-400">{fmt(s.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">12m Expenses</span>
                  <span className="font-mono text-red-400">{fmt(s.totalExpenses)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border/40 pt-1 mt-1">
                  <span className="text-muted-foreground">Ending Cash</span>
                  <span className={`font-mono ${s.endingCashPosition >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.endingCashPosition >= 0 ? "+" : ""}{fmt(s.endingCashPosition)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs">
                {s.totalRevenue > s.totalExpenses
                  ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
                }
                <span className="text-muted-foreground">
                  Net {s.totalRevenue > s.totalExpenses ? "surplus" : "deficit"} of {fmt(Math.abs(s.totalNetCash))} over 12 months
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add custom scenario card */}
        <button
          onClick={openNew}
          className="border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2 min-h-[180px]"
        >
          <Plus className="h-5 w-5" />
          Add Custom Scenario
        </button>
      </div>

      {/* Edit/Create dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) setEditOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Scenario" : "New Scenario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Conservative Growth"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Revenue Multiplier</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5"
                  value={form.revenueMultiplier}
                  onChange={(e) => setForm((f) => ({ ...f, revenueMultiplier: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">1.0 = 100% (no change)</p>
              </div>
              <div className="space-y-1.5">
                <Label>Expense Multiplier</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5"
                  value={form.expenseMultiplier}
                  onChange={(e) => setForm((f) => ({ ...f, expenseMultiplier: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">1.0 = 100% (no change)</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-secondary/40 rounded p-3">
              <p className="font-medium mb-1">Projected impact</p>
              <p>Revenue: {(parseFloat(form.revenueMultiplier || "1") * 100 - 100).toFixed(0)}% vs base</p>
              <p>Expenses: {(parseFloat(form.expenseMultiplier || "1") * 100 - 100).toFixed(0)}% vs base</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Scenario</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this custom scenario.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
