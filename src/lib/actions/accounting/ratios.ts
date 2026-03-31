"use server";

import { prisma } from "@/lib/prisma";
import { getOwnerBusiness } from "@/lib/actions/tenants";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RatioPoint {
  value: number | null;
  label: string; // "Jan 2026"
}

export interface Ratio {
  current:   number | null;
  history:   RatioPoint[]; // 12 months, oldest → newest
  benchmark: { low: number; high: number; direction: "higher" | "lower" };
}

export interface FinancialRatiosData {
  asOf:   Date;
  ytdStart: Date;
  // Liquidity
  currentRatio:  Ratio;
  quickRatio:    Ratio;
  cashRatio:     Ratio;
  // Profitability (YTD)
  grossMargin:      Ratio;
  operatingMargin:  Ratio;
  netMargin:        Ratio;
  roa:              Ratio;
  roe:              Ratio;
  // Efficiency (YTD annualised)
  dso:              Ratio;
  dpo:              Ratio;
  dio:              Ratio;
  ccc:              Ratio;
  // Solvency
  debtToEquity:  Ratio;
  debtRatio:     Ratio;
  interestCoverage: Ratio;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type Line = { debit: unknown; credit: unknown; journalEntry: { date: Date } };
type Account = {
  code: string; type: string; normalBalance: string; isContra: boolean;
  journalEntryLines: Line[];
};

function toNum(v: unknown) { return Number(v ?? 0); }

function balanceAt(acc: Account, upTo: Date): number {
  const dr = acc.journalEntryLines
    .filter(l => l.journalEntry.date <= upTo)
    .reduce((s, l) => s + toNum(l.debit), 0);
  const cr = acc.journalEntryLines
    .filter(l => l.journalEntry.date <= upTo)
    .reduce((s, l) => s + toNum(l.credit), 0);
  return acc.normalBalance === "debit" ? dr - cr : cr - dr;
}

function balanceInRange(acc: Account, from: Date, to: Date): number {
  const dr = acc.journalEntryLines
    .filter(l => l.journalEntry.date >= from && l.journalEntry.date <= to)
    .reduce((s, l) => s + toNum(l.debit), 0);
  const cr = acc.journalEntryLines
    .filter(l => l.journalEntry.date >= from && l.journalEntry.date <= to)
    .reduce((s, l) => s + toNum(l.credit), 0);
  return acc.normalBalance === "debit" ? dr - cr : cr - dr;
}

function safe(num: number, den: number): number | null {
  return den === 0 ? null : num / den;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getFinancialRatios(): Promise<FinancialRatiosData | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const now   = new Date();
  const asOf  = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // current month-end

  // Fetch all accounts with all lines (full history — needed for cumulative BS)
  const accounts = await prisma.ledgerAccount.findMany({
    where:   { tenantId: owner.id, isActive: true },
    orderBy: { code: "asc" },
    include: {
      journalEntryLines: {
        include: { journalEntry: { select: { date: true } } },
      },
    },
  });

  // Build helper maps
  const byCode = (code: string) => accounts.find(a => a.code === code);
  const sumType = (type: string, from: Date | null, to: Date) => {
    return accounts
      .filter(a => a.type === type)
      .reduce((s, a) => s + (from ? balanceInRange(a, from, to) : balanceAt(a, to)), 0);
  };

  // Generate 12 month-end snapshots (oldest first)
  const monthEnds: Date[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    monthEnds.push(d);
  }

  const monthLabels = monthEnds.map(d =>
    d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  );

  // YTD: Jan 1 of current year to now
  const ytdStart = new Date(now.getFullYear(), 0, 1);

  // ── Snapshot helpers ─────────────────────────────────────────────────────

  function snapshot(end: Date) {
    // Balance sheet values (cumulative up to end)
    const cash        = balanceAt(byCode("1000")!, end);
    const ar          = balanceAt(byCode("1100")!, end);
    const allowance   = balanceAt(byCode("1110")!, end); // credit-normal, returns positive when credit balance
    const netAR       = ar - allowance;
    const inventory   = balanceAt(byCode("1200")!, end);
    const ap          = balanceAt(byCode("2000")!, end);

    const curAssets = accounts
      .filter(a => a.type === "Asset" && a.code < "1500")
      .reduce((s, a) => s + (a.isContra ? -balanceAt(a, end) : balanceAt(a, end)), 0);
    const ncAssets = accounts
      .filter(a => a.type === "Asset" && a.code >= "1500")
      .reduce((s, a) => s + (a.isContra ? -balanceAt(a, end) : balanceAt(a, end)), 0);
    const totalAssets = curAssets + ncAssets;

    const curLiab = accounts
      .filter(a => a.type === "Liability" && a.code < "2400")
      .reduce((s, a) => s + balanceAt(a, end), 0);
    const ncLiab = accounts
      .filter(a => a.type === "Liability" && a.code >= "2400")
      .reduce((s, a) => s + balanceAt(a, end), 0);
    const totalLiab = curLiab + ncLiab;

    const equityAccts = accounts
      .filter(a => a.type === "Equity")
      .reduce((s, a) => s + (a.isContra ? -balanceAt(a, end) : balanceAt(a, end)), 0);
    const revenue   = accounts.filter(a => a.type === "Revenue")     .reduce((s, a) => s + balanceAt(a, end), 0);
    const cos       = accounts.filter(a => a.type === "CostOfSales") .reduce((s, a) => s + balanceAt(a, end), 0);
    const expenses  = accounts.filter(a => a.type === "Expense")     .reduce((s, a) => s + balanceAt(a, end), 0);
    const nonOp     = accounts.filter(a => a.type === "NonOperating").reduce((s, a) => {
      const b = balanceAt(a, end);
      return s + (a.code.startsWith("44") ? b : -b);
    }, 0);
    const retainedNetIncome = revenue - cos - expenses + nonOp;
    const totalEquity = equityAccts + retainedNetIncome;

    return { cash, ar: netAR, inventory, ap, curAssets, totalAssets, curLiab, totalLiab, totalEquity };
  }

  function periodIncome(from: Date, to: Date) {
    const revenue   = accounts.filter(a => a.type === "Revenue")     .reduce((s, a) => s + balanceInRange(a, from, to), 0);
    const cos       = accounts.filter(a => a.type === "CostOfSales") .reduce((s, a) => s + balanceInRange(a, from, to), 0);
    const expenses  = accounts.filter(a => a.type === "Expense")     .reduce((s, a) => s + balanceInRange(a, from, to), 0);
    const grossProfit = revenue - cos;
    const operatingIncome = grossProfit - expenses;
    const interest = byCode("7000") ? balanceInRange(byCode("7000")!, from, to) : 0;
    const netIncome = operatingIncome - interest;
    const days = Math.max((to.getTime() - from.getTime()) / 86400000, 1);
    return { revenue, cos, grossProfit, operatingIncome, netIncome, interest, days };
  }

  // ── Current-period values ─────────────────────────────────────────────────

  const bs  = snapshot(asOf);
  const ytd = periodIncome(ytdStart, asOf);
  const ytdDays = (asOf.getTime() - ytdStart.getTime()) / 86400000;

  // Liquidity
  const currentRatioCurrent  = safe(bs.curAssets, bs.curLiab);
  const quickRatioCurrent    = safe(bs.cash + bs.ar, bs.curLiab);
  const cashRatioCurrent     = safe(bs.cash, bs.curLiab);

  // Profitability (YTD)
  const grossMarginCurrent     = ytd.revenue ? (ytd.grossProfit / ytd.revenue) * 100 : null;
  const operatingMarginCurrent = ytd.revenue ? (ytd.operatingIncome / ytd.revenue) * 100 : null;
  const netMarginCurrent       = ytd.revenue ? (ytd.netIncome / ytd.revenue) * 100 : null;
  const roaCurrent             = bs.totalAssets ? (ytd.netIncome / bs.totalAssets) * 100 : null;
  const roeCurrent             = bs.totalEquity ? (ytd.netIncome / bs.totalEquity) * 100 : null;

  // Efficiency (annualised from YTD)
  const annFactor = ytdDays > 0 ? 365 / ytdDays : 1;
  const annRevenue = ytd.revenue * annFactor;
  const annCos     = ytd.cos     * annFactor;
  const dsoCurrent = annRevenue ? safe(bs.ar * 365, annRevenue) : null;
  const dpoCurrent = annCos     ? safe(bs.ap * 365, annCos)     : null;
  const dioCurrent = annCos     ? safe(bs.inventory * 365, annCos) : null;
  const cccCurrent = dsoCurrent !== null && dpoCurrent !== null && dioCurrent !== null
    ? dsoCurrent + dioCurrent - dpoCurrent : null;

  // Solvency
  const debtToEquityCurrent  = safe(bs.totalLiab, bs.totalEquity);
  const debtRatioCurrent     = safe(bs.totalLiab, bs.totalAssets);
  const interestCovCurrent   = ytd.interest > 0 ? safe(ytd.operatingIncome, ytd.interest) : null;

  // ── Monthly history ───────────────────────────────────────────────────────

  const history = monthEnds.map((end, i) => {
    const mbs  = snapshot(end);
    const mStart = i === 0
      ? new Date(end.getFullYear(), end.getMonth(), 1)
      : new Date(monthEnds[i - 1].getFullYear(), monthEnds[i - 1].getMonth() + 1, 1);
    const inc  = periodIncome(mStart, end);
    const mDays = Math.max((end.getTime() - mStart.getTime()) / 86400000, 1);
    const mAnnFactor = 365 / mDays;
    const mAnnRev = inc.revenue * mAnnFactor;
    const mAnnCos = inc.cos     * mAnnFactor;

    return {
      currentRatio:     safe(mbs.curAssets, mbs.curLiab),
      quickRatio:       safe(mbs.cash + mbs.ar, mbs.curLiab),
      cashRatio:        safe(mbs.cash, mbs.curLiab),
      grossMargin:      inc.revenue ? (inc.grossProfit / inc.revenue) * 100 : null,
      operatingMargin:  inc.revenue ? (inc.operatingIncome / inc.revenue) * 100 : null,
      netMargin:        inc.revenue ? (inc.netIncome / inc.revenue) * 100 : null,
      roa:              mbs.totalAssets ? (inc.netIncome / mbs.totalAssets) * 100 : null,
      roe:              mbs.totalEquity ? (inc.netIncome / mbs.totalEquity) * 100 : null,
      dso:              mAnnRev ? safe(mbs.ar * 365, mAnnRev) : null,
      dpo:              mAnnCos ? safe(mbs.ap * 365, mAnnCos) : null,
      dio:              mAnnCos ? safe(mbs.inventory * 365, mAnnCos) : null,
      debtToEquity:     safe(mbs.totalLiab, mbs.totalEquity),
      debtRatio:        safe(mbs.totalLiab, mbs.totalAssets),
    };
  });

  function makeRatio(
    current: number | null,
    key: keyof typeof history[0],
    benchmark: Ratio["benchmark"],
  ): Ratio {
    return {
      current,
      benchmark,
      history: history.map((h, i) => ({ value: h[key] as number | null, label: monthLabels[i] })),
    };
  }

  // CCC history (derived from DSO+DIO-DPO)
  const cccHistory: RatioPoint[] = history.map((h, i) => {
    const v = h.dso !== null && h.dpo !== null && h.dio !== null
      ? h.dso + h.dio - h.dpo : null;
    return { value: v, label: monthLabels[i] };
  });

  return {
    asOf,
    ytdStart,
    currentRatio:     makeRatio(currentRatioCurrent,     "currentRatio",    { low: 1.5, high: 3,   direction: "higher" }),
    quickRatio:       makeRatio(quickRatioCurrent,        "quickRatio",      { low: 1.0, high: 2,   direction: "higher" }),
    cashRatio:        makeRatio(cashRatioCurrent,         "cashRatio",       { low: 0.5, high: 1.5, direction: "higher" }),
    grossMargin:      makeRatio(grossMarginCurrent,       "grossMargin",     { low: 30,  high: 60,  direction: "higher" }),
    operatingMargin:  makeRatio(operatingMarginCurrent,   "operatingMargin", { low: 10,  high: 25,  direction: "higher" }),
    netMargin:        makeRatio(netMarginCurrent,         "netMargin",       { low: 5,   high: 20,  direction: "higher" }),
    roa:              makeRatio(roaCurrent,               "roa",             { low: 5,   high: 15,  direction: "higher" }),
    roe:              makeRatio(roeCurrent,               "roe",             { low: 10,  high: 20,  direction: "higher" }),
    dso:              makeRatio(dsoCurrent,               "dso",             { low: 30,  high: 60,  direction: "lower"  }),
    dpo:              makeRatio(dpoCurrent,               "dpo",             { low: 30,  high: 60,  direction: "higher" }),
    dio:              makeRatio(dioCurrent,               "dio",             { low: 30,  high: 90,  direction: "lower"  }),
    ccc:              { current: cccCurrent, benchmark: { low: 30, high: 90, direction: "lower" }, history: cccHistory },
    debtToEquity:     makeRatio(debtToEquityCurrent,      "debtToEquity",    { low: 1,   high: 2,   direction: "lower"  }),
    debtRatio:        makeRatio(debtRatioCurrent,         "debtRatio",       { low: 0.3, high: 0.5, direction: "lower"  }),
    interestCoverage: {
      current: interestCovCurrent,
      benchmark: { low: 3, high: 10, direction: "higher" },
      history: history.map((_, i) => ({ value: null, label: monthLabels[i] })), // too noisy monthly
    },
  };
}
