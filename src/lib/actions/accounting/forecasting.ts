"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOwnerBusiness } from "@/lib/actions/tenants";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MonthlyForecast {
  month: string;   // "2026-04"
  label: string;   // "Apr 2026"
  // Revenue
  recurringRevenue: number;
  pipelineRevenue:  number;
  trendRevenue:     number;
  totalRevenue:     number;
  // Expenses
  recurringBills:   number;
  payroll:          number;
  trendExpenses:    number;
  totalExpenses:    number;
  // Cash
  netCashFlow:      number;
  cumulativeCash:   number;
  // Actuals (populated for past months)
  actualRevenue:    number | null;
  actualExpenses:   number | null;
}

export interface ScenarioForecast {
  scenarioId:        string | null;
  scenarioName:      string;
  scenarioType:      string;
  revenueMultiplier: number;
  expenseMultiplier: number;
  months:            MonthlyForecast[];
  totalRevenue:      number;
  totalExpenses:     number;
  totalNetCash:      number;
  endingCashPosition:number;
}

export interface HistoricalMonth {
  month:           string;
  label:           string;
  actualRevenue:   number;
  actualExpenses:  number;
  netCash:         number;
}

export interface ForecastData {
  asOf:             string;
  startingCash:     number;
  historicalMonths: HistoricalMonth[];
  scenarios:        ScenarioForecast[];
}

export interface MonthlyOverride {
  month:             string;
  additionalRevenue: number;
  additionalExpense: number;
  note:              string;
}

export interface ScenarioRow {
  id:                string;
  name:              string;
  type:              string;
  revenueMultiplier: number;
  expenseMultiplier: number;
  monthlyOverrides:  MonthlyOverride[];
  isDefault:         boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(v: unknown) { return Number(v ?? 0); }

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function monthStart(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

function monthEnd(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59);
}

// Add N months to a date, return new Date
function addMonths(d: Date, n: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + n);
  return result;
}

// Simple linear trend: returns the monthly growth increment
function linearTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  // Least-squares slope
  const xBar = (n - 1) / 2;
  const yBar = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xBar) * (values[i] - yBar);
    den += (i - xBar) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ── GL monthly aggregation ────────────────────────────────────────────────────

interface GlEntry { date: Date; debit: unknown; credit: unknown; normalBalance: string }

function glMonthlyTotals(
  entries: GlEntry[],
  fromDate: Date,
  months: number,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    const d = e.date;
    if (d < fromDate) continue;
    const k = monthKey(d);
    const bal = e.normalBalance === "debit"
      ? toNum(e.debit) - toNum(e.credit)
      : toNum(e.credit) - toNum(e.debit);
    map.set(k, (map.get(k) ?? 0) + bal);
  }
  return map;
}

// ── Recurring invoice projection ─────────────────────────────────────────────

function projectRecurringInvoices(
  invoices: Array<{
    total: unknown;
    nextRecurringDate: Date | null;
    recurringInterval: string | null;
  }>,
  futureMonths: string[], // YYYY-MM list
): Map<string, number> {
  const map = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.nextRecurringDate) continue;
    const amount = toNum(inv.total);
    const interval = inv.recurringInterval ?? "monthly";

    let cursor = new Date(inv.nextRecurringDate);
    const horizonEnd = new Date(futureMonths[futureMonths.length - 1] + "-28");

    while (cursor <= horizonEnd) {
      const k = monthKey(cursor);
      if (futureMonths.includes(k)) {
        map.set(k, (map.get(k) ?? 0) + amount);
      }
      if (interval === "monthly")    cursor = addMonths(cursor, 1);
      else if (interval === "quarterly") cursor = addMonths(cursor, 3);
      else if (interval === "annually")  cursor = addMonths(cursor, 12);
      else cursor = addMonths(cursor, 1);
    }
  }
  return map;
}

// ── Recurring bill detection (heuristic) ─────────────────────────────────────
// Group by vendor, find vendors billed 3+ of last 6 months at similar amount

function detectRecurringBills(
  bills: Array<{ vendorId: string; totalAmount: unknown; dueDate: Date }>,
  futureMonths: string[],
): Map<string, number> {
  const map = new Map<string, number>();

  // Group by vendor
  const byVendor = new Map<string, Array<{ month: string; amount: number }>>();
  for (const b of bills) {
    const months = byVendor.get(b.vendorId) ?? [];
    months.push({ month: monthKey(b.dueDate), amount: toNum(b.totalAmount) });
    byVendor.set(b.vendorId, months);
  }

  for (const [, entries] of byVendor) {
    if (entries.length < 3) continue;
    const amounts = entries.map((e) => e.amount);
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const allClose = amounts.every((a) => Math.abs(a - avg) / (avg || 1) < 0.15);
    if (!allClose) continue;
    // Project this avg amount each future month
    for (const fm of futureMonths) {
      map.set(fm, (map.get(fm) ?? 0) + avg);
    }
  }
  return map;
}

// ── Pipeline revenue distribution ────────────────────────────────────────────

function projectPipelineRevenue(
  projects: Array<{
    budgetAmount: unknown;
    endDate: Date | null;
    invoicedTotal: number;
  }>,
  now: Date,
  futureMonths: string[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of futureMonths) map.set(p, 0);

  for (const proj of projects) {
    const budget = toNum(proj.budgetAmount);
    if (budget <= 0) continue;
    const remaining = Math.max(0, budget - proj.invoicedTotal);
    if (remaining < 1) continue;

    const endDate = proj.endDate ?? addMonths(now, 6);
    const endMk = monthKey(endDate);

    const eligibleMonths = futureMonths.filter((m) => m <= endMk);
    if (eligibleMonths.length === 0) continue;

    const perMonth = remaining / eligibleMonths.length;
    for (const m of eligibleMonths) {
      map.set(m, (map.get(m) ?? 0) + perMonth);
    }
  }
  return map;
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function getForecastData(): Promise<ForecastData | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1; // 1-based

  // ── 12 months historical (ending last month)
  const histStart = monthStart(
    nowMonth === 1 ? nowYear - 1 : nowYear,
    nowMonth === 1 ? 1 : nowMonth - 1 - 11 < 1 ? nowMonth + 1 : ((nowMonth - 12 - 1 + 12) % 12) + 1,
  );
  // Simpler: just go back 12 months from start of current month
  const currentMonthStart = monthStart(nowYear, nowMonth);
  const histFromDate = addMonths(currentMonthStart, -12);

  // ── Build 12 future month keys (starting this month)
  const futureMonths: string[] = [];
  const futureLabels: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = addMonths(currentMonthStart, i);
    futureMonths.push(monthKey(d));
    futureLabels.push(monthLabel(new Date(d.getFullYear(), d.getMonth(), 15)));
  }

  // ── GL accounts (revenue + expense, last 12 + future)
  const glFromDate = histFromDate;
  const glToDate   = monthEnd(nowYear, nowMonth + 11 < 12 ? nowMonth + 11 : nowMonth + 11);

  const accounts = await prisma.ledgerAccount.findMany({
    where:   { tenantId: owner.id, isActive: true, type: { in: ["Revenue", "Expense", "CostOfSales", "Asset"] } },
    include: {
      journalEntryLines: {
        where: { journalEntry: { date: { gte: glFromDate, lte: glToDate } } },
        include: { journalEntry: { select: { date: true } } },
      },
    },
  });

  // Flatten GL entries tagged by account type
  const revEntries: GlEntry[] = [];
  const expEntries: GlEntry[] = [];
  let startingCash = 0;

  for (const acc of accounts) {
    if (acc.type === "Revenue") {
      for (const l of acc.journalEntryLines) {
        revEntries.push({ date: l.journalEntry.date, debit: l.debit, credit: l.credit, normalBalance: acc.normalBalance });
      }
    } else if (acc.type === "Expense" || acc.type === "CostOfSales") {
      for (const l of acc.journalEntryLines) {
        expEntries.push({ date: l.journalEntry.date, debit: l.debit, credit: l.credit, normalBalance: acc.normalBalance });
      }
    } else if (acc.type === "Asset" && acc.code.startsWith("10")) {
      // Cash & bank accounts
      const all = acc.journalEntryLines;
      const dr = all.reduce((s, l) => s + toNum(l.debit), 0);
      const cr = all.reduce((s, l) => s + toNum(l.credit), 0);
      startingCash += acc.normalBalance === "debit" ? dr - cr : cr - dr;
    }
  }

  // Historical monthly GL totals
  const histRevMap  = glMonthlyTotals(revEntries, histFromDate, 12);
  const histExpMap  = glMonthlyTotals(expEntries, histFromDate, 12);

  // Build historical months array (last 12 completed months)
  const historicalMonths: HistoricalMonth[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = addMonths(currentMonthStart, -(i + 1));
    const k = monthKey(d);
    const rev = histRevMap.get(k) ?? 0;
    const exp = histExpMap.get(k) ?? 0;
    historicalMonths.push({
      month: k,
      label: monthLabel(new Date(d.getFullYear(), d.getMonth(), 15)),
      actualRevenue:  rev,
      actualExpenses: exp,
      netCash:        rev - exp,
    });
  }

  // Trend: last 6 months average + slope
  const last6Rev = historicalMonths.slice(-6).map((m) => m.actualRevenue);
  const last6Exp = historicalMonths.slice(-6).map((m) => m.actualExpenses);
  const revSlope = linearTrend(last6Rev);
  const expSlope = linearTrend(last6Exp);
  const revBase  = last6Rev[last6Rev.length - 1] ?? 0;
  const expBase  = last6Exp[last6Exp.length - 1] ?? 0;

  // ── Recurring invoices
  const recurringInvoices = await prisma.invoice.findMany({
    where: {
      tenantId:    owner.id,
      isRecurring: true,
      status:      { notIn: ["void", "cancelled"] },
    },
    select: { total: true, nextRecurringDate: true, recurringInterval: true },
  });
  const recurRevMap = projectRecurringInvoices(recurringInvoices, futureMonths);

  // ── Pipeline projects
  const activeProjects = await prisma.project.findMany({
    where: {
      tenantId: owner.id,
      status:   { in: ["not_started", "in_progress"] },
      budgetAmount: { not: null },
    },
    select: { id: true, budgetAmount: true, endDate: true },
  });

  // Get invoiced totals per project
  const projectIds = activeProjects.map((p) => p.id);
  const projectInvoiced = projectIds.length > 0
    ? await prisma.invoice.groupBy({
        by:    ["projectId"],
        where: { tenantId: owner.id, projectId: { in: projectIds }, status: { notIn: ["void", "cancelled"] } },
        _sum:  { total: true },
      })
    : [];
  const invoicedByProject = new Map(
    projectInvoiced.map((p) => [p.projectId, toNum(p._sum.total)])
  );

  const pipelineMap = projectPipelineRevenue(
    activeProjects.map((p) => ({
      budgetAmount:  p.budgetAmount,
      endDate:       p.endDate,
      invoicedTotal: invoicedByProject.get(p.id) ?? 0,
    })),
    now,
    futureMonths,
  );

  // ── Recent bills (last 6 months) for recurring detection
  const recentBills = await prisma.bill.findMany({
    where: {
      tenantId:  owner.id,
      dueDate:   { gte: addMonths(now, -6) },
      status:    { notIn: ["void"] },
    },
    select: { vendorId: true, totalAmount: true, dueDate: true },
  });
  const billRecurMap = detectRecurringBills(recentBills, futureMonths);

  // ── Average monthly payroll (last 3 paid runs)
  const recentPayroll = await prisma.payrollRun.findMany({
    where:   { tenantId: owner.id, status: "paid" },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    take:    3,
    select:  { totalGross: true },
  });
  const avgPayroll = recentPayroll.length > 0
    ? recentPayroll.reduce((s, r) => s + toNum(r.totalGross), 0) / recentPayroll.length
    : 0;

  // ── Load saved scenarios (or use defaults)
  const savedScenarios = await prisma.forecastScenario.findMany({
    where:   { tenantId: owner.id },
    orderBy: { createdAt: "asc" },
  });

  const defaultScenarios = [
    { id: null, name: "Base",        type: "base",        revMul: 1.0, expMul: 1.0 },
    { id: null, name: "Optimistic",  type: "optimistic",  revMul: 1.2, expMul: 0.9 },
    { id: null, name: "Pessimistic", type: "pessimistic", revMul: 0.8, expMul: 1.1 },
  ];

  // Merge: use saved versions for base/optimistic/pessimistic if they exist, else defaults
  type ScenarioDef = {
    id: string | null;
    name: string;
    type: string;
    revMul: number;
    expMul: number;
    overrides: MonthlyOverride[];
  };

  const scenarios: ScenarioDef[] = [];
  for (const def of defaultScenarios) {
    const saved = savedScenarios.find((s) => s.type === def.type);
    if (saved) {
      scenarios.push({
        id:       saved.id,
        name:     saved.name,
        type:     saved.type,
        revMul:   toNum(saved.revenueMultiplier),
        expMul:   toNum(saved.expenseMultiplier),
        overrides: saved.monthlyOverrides as unknown as MonthlyOverride[],
      });
    } else {
      scenarios.push({ id: null, name: def.name, type: def.type, revMul: def.revMul, expMul: def.expMul, overrides: [] });
    }
  }
  // Append custom scenarios
  for (const s of savedScenarios.filter((s) => s.type === "custom")) {
    scenarios.push({
      id:       s.id,
      name:     s.name,
      type:     s.type,
      revMul:   toNum(s.revenueMultiplier),
      expMul:   toNum(s.expenseMultiplier),
      overrides: s.monthlyOverrides as unknown as MonthlyOverride[],
    });
  }

  // ── Compute monthly forecast for each scenario
  const builtScenarios: ScenarioForecast[] = scenarios.map((sc) => {
    let cumulative = startingCash;
    const months: MonthlyForecast[] = futureMonths.map((mk, i) => {
      const overrideEntry = sc.overrides.find((o) => o.month === mk);
      const addRev  = overrideEntry?.additionalRevenue ?? 0;
      const addExp  = overrideEntry?.additionalExpense ?? 0;

      // Revenue sources
      const recurring  = (recurRevMap.get(mk) ?? 0) * sc.revMul;
      const pipeline   = (pipelineMap.get(mk) ?? 0) * sc.revMul;
      const trend      = Math.max(0, (revBase + revSlope * (i + 1)) * sc.revMul);
      const trendContrib = Math.max(0, trend - recurring - pipeline);

      // Expense sources
      const bills      = (billRecurMap.get(mk) ?? 0) * sc.expMul;
      const pay        = avgPayroll * sc.expMul;
      const expTrend   = Math.max(0, (expBase + expSlope * (i + 1)) * sc.expMul);
      const expTrendContrib = Math.max(0, expTrend - bills - pay);

      const totalRev   = recurring + pipeline + trendContrib + addRev;
      const totalExp   = bills + pay + expTrendContrib + addExp;
      const net        = totalRev - totalExp;
      cumulative      += net;

      // Actuals for current month (partial)
      const actualRev  = histRevMap.get(mk) ?? null;
      const actualExp  = histExpMap.get(mk) ?? null;

      return {
        month:           mk,
        label:           futureLabels[i],
        recurringRevenue: recurring,
        pipelineRevenue:  pipeline,
        trendRevenue:     trendContrib,
        totalRevenue:     totalRev,
        recurringBills:   bills,
        payroll:          pay,
        trendExpenses:    expTrendContrib,
        totalExpenses:    totalExp,
        netCashFlow:      net,
        cumulativeCash:   cumulative,
        actualRevenue:    actualRev,
        actualExpenses:   actualExp,
      };
    });

    const totRev = months.reduce((s, m) => s + m.totalRevenue, 0);
    const totExp = months.reduce((s, m) => s + m.totalExpenses, 0);

    return {
      scenarioId:         sc.id,
      scenarioName:       sc.name,
      scenarioType:       sc.type,
      revenueMultiplier:  sc.revMul,
      expenseMultiplier:  sc.expMul,
      months,
      totalRevenue:       totRev,
      totalExpenses:      totExp,
      totalNetCash:       totRev - totExp,
      endingCashPosition: months[months.length - 1].cumulativeCash,
    };
  });

  return {
    asOf:             now.toISOString(),
    startingCash,
    historicalMonths,
    scenarios:        builtScenarios,
  };
}

// ── Scenario CRUD ─────────────────────────────────────────────────────────────

export async function getScenarios(): Promise<ScenarioRow[]> {
  const owner = await getOwnerBusiness();
  if (!owner) return [];

  const rows = await prisma.forecastScenario.findMany({
    where:   { tenantId: owner.id },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((s) => ({
    id:                s.id,
    name:              s.name,
    type:              s.type,
    revenueMultiplier: toNum(s.revenueMultiplier),
    expenseMultiplier: toNum(s.expenseMultiplier),
    monthlyOverrides:  s.monthlyOverrides as unknown as MonthlyOverride[],
    isDefault:         s.isDefault,
  }));
}

export async function upsertScenario(input: {
  id?: string;
  name: string;
  type: string;
  revenueMultiplier: number;
  expenseMultiplier: number;
  monthlyOverrides: MonthlyOverride[];
}): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  try {
    if (input.id) {
      await prisma.forecastScenario.update({
        where: { id: input.id, tenantId: owner.id },
        data: {
          name:              input.name,
          revenueMultiplier: input.revenueMultiplier,
          expenseMultiplier: input.expenseMultiplier,
          monthlyOverrides:  input.monthlyOverrides as object[],
        },
      });
    } else {
      await prisma.forecastScenario.create({
        data: {
          tenantId:          owner.id,
          name:              input.name,
          type:              input.type,
          revenueMultiplier: input.revenueMultiplier,
          expenseMultiplier: input.expenseMultiplier,
          monthlyOverrides:  input.monthlyOverrides as object[],
        },
      });
    }
    revalidatePath("/africs/finance/forecasting");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteScenario(id: string): Promise<{ success?: boolean; error?: string }> {
  const owner = await getOwnerBusiness();
  if (!owner) return { error: "No business found" };

  await prisma.forecastScenario.delete({ where: { id, tenantId: owner.id } });
  revalidatePath("/africs/finance/forecasting");
  return { success: true };
}
