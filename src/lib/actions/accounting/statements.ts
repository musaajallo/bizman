"use server";

import { prisma } from "@/lib/prisma";
import { getOwnerBusiness } from "@/lib/actions/tenants";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(d: unknown) { return Number(d ?? 0); }

type AccountRow = {
  id: string; code: string; name: string; type: string;
  normalBalance: string; isContra: boolean;
  journalEntryLines: { debit: unknown; credit: unknown; journalEntry: { date: Date } }[];
};

function balance(a: AccountRow, lines?: typeof a.journalEntryLines): number {
  const src = lines ?? a.journalEntryLines;
  const dr = src.reduce((s, l) => s + toNum(l.debit), 0);
  const cr = src.reduce((s, l) => s + toNum(l.credit), 0);
  return a.normalBalance === "debit" ? dr - cr : cr - dr;
}

async function getAccountsWithLines(tenantId: string, startDate?: Date, endDate?: Date) {
  return prisma.ledgerAccount.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: "asc" },
    include: {
      journalEntryLines: {
        where: startDate || endDate ? {
          journalEntry: {
            date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate   ? { lte: endDate }   : {}),
            },
          },
        } : undefined,
        include: { journalEntry: { select: { date: true } } },
      },
    },
  });
}

// ── Income Statement (P&L) ───────────────────────────────────────────────────

export interface PLLine { code: string; name: string; amount: number }

export type PLPeriodData = {
  revenue:           PLLine[];
  totalRevenue:      number;
  costOfSales:       PLLine[];
  totalCostOfSales:  number;
  grossProfit:       number;
  grossMargin:       number;
  opExpenses:        PLLine[];
  totalOpExpenses:   number;
  operatingIncome:   number;
  operatingMargin:   number;
  nonOperating:      PLLine[];
  totalNonOperating: number;
  netIncome:         number;
  netMargin:         number;
};

export interface IncomeStatement extends PLPeriodData {
  period: { startDate: Date; endDate: Date };
  prior?: PLPeriodData;
}

function computeIncomeStatement(accounts: AccountRow[]): PLPeriodData {
  const revenue      = accounts.filter(a => a.type === "Revenue")      .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);
  const costOfSales  = accounts.filter(a => a.type === "CostOfSales")  .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);
  const opExpenses   = accounts.filter(a => a.type === "Expense")      .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);
  const nonOperating = accounts.filter(a => a.type === "NonOperating") .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);

  const totalRevenue      = revenue.reduce((s, r) => s + r.amount, 0);
  const totalCostOfSales  = costOfSales.reduce((s, r) => s + r.amount, 0);
  const grossProfit       = totalRevenue - totalCostOfSales;
  const totalOpExpenses   = opExpenses.reduce((s, r) => s + r.amount, 0);
  const operatingIncome   = grossProfit - totalOpExpenses;
  const totalNonOperating = nonOperating.reduce((s, r) => s + (r.code.startsWith("44") ? r.amount : -r.amount), 0);
  const netIncome         = operatingIncome + totalNonOperating;

  return {
    revenue, totalRevenue,
    costOfSales, totalCostOfSales,
    grossProfit,
    grossMargin:      totalRevenue ? (grossProfit / totalRevenue) * 100 : 0,
    opExpenses, totalOpExpenses,
    operatingIncome,
    operatingMargin:  totalRevenue ? (operatingIncome / totalRevenue) * 100 : 0,
    nonOperating, totalNonOperating,
    netIncome,
    netMargin:        totalRevenue ? (netIncome / totalRevenue) * 100 : 0,
  };
}

export async function getIncomeStatement(
  startDate: Date, endDate: Date,
  priorStartDate?: Date, priorEndDate?: Date,
): Promise<IncomeStatement | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const accounts = await getAccountsWithLines(owner.id, startDate, endDate);
  const current = computeIncomeStatement(accounts);

  let prior: PLPeriodData | undefined;
  if (priorStartDate && priorEndDate) {
    const priorAccounts = await getAccountsWithLines(owner.id, priorStartDate, priorEndDate);
    prior = computeIncomeStatement(priorAccounts);
  }

  return { period: { startDate, endDate }, ...current, prior };
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────

export interface BSLine { code: string; name: string; amount: number; isContra: boolean }

export type BSPeriodData = {
  currentAssets:        BSLine[];
  nonCurrentAssets:     BSLine[];
  totalAssets:          number;
  currentLiabilities:   BSLine[];
  nonCurrentLiabilities:BSLine[];
  totalLiabilities:     number;
  equity:               BSLine[];
  retainedNetIncome:    number;
  totalEquity:          number;
  totalLiabEquity:      number;
  balanced:             boolean;
};

export interface BalanceSheet extends BSPeriodData {
  asOf: Date;
  prior?: BSPeriodData & { asOf: Date };
}

function computeBalanceSheet(accounts: AccountRow[]): BSPeriodData {
  function mapLines(accs: AccountRow[]): BSLine[] {
    return accs.map(a => ({ code: a.code, name: a.name, amount: Math.abs(balance(a)), isContra: a.isContra }))
      .filter(r => r.amount !== 0);
  }

  const currentAssets        = mapLines(accounts.filter(a => a.type === "Asset"     && a.code <  "1500"));
  const nonCurrentAssets     = mapLines(accounts.filter(a => a.type === "Asset"     && a.code >= "1500"));
  const currentLiabilities   = mapLines(accounts.filter(a => a.type === "Liability" && a.code <  "2400"));
  const nonCurrentLiabilities = mapLines(accounts.filter(a => a.type === "Liability" && a.code >= "2400"));
  const equityAccounts       = mapLines(accounts.filter(a => a.type === "Equity"));

  const sumAssets = (lines: BSLine[]) => lines.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);
  const sumLiab   = (lines: BSLine[]) => lines.reduce((s, l) => s + l.amount, 0);

  const totalAssets     = sumAssets(currentAssets) + sumAssets(nonCurrentAssets);
  const totalLiabilities = sumLiab(currentLiabilities) + sumLiab(nonCurrentLiabilities);

  const totalEquityAccounts = equityAccounts.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);

  const revenue     = accounts.filter(a => a.type === "Revenue")      .reduce((s, a) => s + balance(a), 0);
  const costOfSales = accounts.filter(a => a.type === "CostOfSales")  .reduce((s, a) => s + balance(a), 0);
  const expenses    = accounts.filter(a => a.type === "Expense")      .reduce((s, a) => s + balance(a), 0);
  const nonOp       = accounts.filter(a => a.type === "NonOperating") .reduce((s, a) => {
    const b = balance(a);
    return s + (a.code.startsWith("44") ? b : -b);
  }, 0);
  const retainedNetIncome = revenue - costOfSales - expenses + nonOp;
  const totalEquity    = totalEquityAccounts + retainedNetIncome;
  const totalLiabEquity = totalLiabilities + totalEquity;

  return {
    currentAssets, nonCurrentAssets, totalAssets,
    currentLiabilities, nonCurrentLiabilities, totalLiabilities,
    equity: equityAccounts,
    retainedNetIncome,
    totalEquity,
    totalLiabEquity,
    balanced: Math.abs(totalAssets - totalLiabEquity) < 1,
  };
}

export async function getBalanceSheet(asOf: Date, priorAsOf?: Date): Promise<BalanceSheet | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const accounts = await getAccountsWithLines(owner.id, undefined, asOf);
  const current = computeBalanceSheet(accounts);

  let prior: (BSPeriodData & { asOf: Date }) | undefined;
  if (priorAsOf) {
    const priorAccounts = await getAccountsWithLines(owner.id, undefined, priorAsOf);
    prior = { ...computeBalanceSheet(priorAccounts), asOf: priorAsOf };
  }

  return { asOf, ...current, prior };
}

// ── Cash Flow (simplified indirect method) ────────────────────────────────────

export interface CashFlowStatement {
  period: { startDate: Date; endDate: Date };
  // Operating
  netIncome:           number;
  depreciation:        number;
  changeInAR:          number;
  changeInInventory:   number;
  changeInAP:          number;
  changeInWagesPayable:number;
  netOperating:        number;
  // Investing
  ppePurchases:        number;
  netInvesting:        number;
  // Financing
  loanProceeds:        number;
  loanRepayments:      number;
  drawings:            number;
  capitalContributions:number;
  netFinancing:        number;
  // Summary
  netCashChange:       number;
  openingCash:         number;
  closingCash:         number;
  prior?: Omit<CashFlowStatement, 'period' | 'prior'>;
}

async function computeCashFlow(tenantId: string, startDate: Date, endDate: Date): Promise<Omit<CashFlowStatement, 'period' | 'prior'>> {
  const periodAccounts = await getAccountsWithLines(tenantId, startDate, endDate);
  const allAccounts    = await getAccountsWithLines(tenantId, undefined, new Date(startDate.getTime() - 1));

  function getAccount(code: string, accs: AccountRow[]) {
    return accs.find(a => a.code === code);
  }

  const revenue   = periodAccounts.filter(a => a.type === "Revenue")     .reduce((s, a) => s + balance(a), 0);
  const cos       = periodAccounts.filter(a => a.type === "CostOfSales") .reduce((s, a) => s + balance(a), 0);
  const expenses  = periodAccounts.filter(a => a.type === "Expense")     .reduce((s, a) => s + balance(a), 0);
  const netIncome = revenue - cos - expenses;

  const depAcc       = getAccount("6500", periodAccounts);
  const depreciation = depAcc ? balance(depAcc) : 0;

  function periodBalance(code: string) {
    const acc = getAccount(code, periodAccounts);
    return acc ? balance(acc) : 0;
  }

  const changeInAR           = -periodBalance("1100");
  const changeInInventory    = -periodBalance("1200");
  const changeInAP           = periodBalance("2000");
  const changeInWagesPayable = periodBalance("2100");
  const netOperating = netIncome + depreciation + changeInAR + changeInInventory + changeInAP + changeInWagesPayable;

  const ppeAcc      = getAccount("1500", periodAccounts);
  const ppePurchases = ppeAcc ? -balance(ppeAcc) : 0;
  const netInvesting = ppePurchases;

  const loanProceedsAcc  = getAccount("2400", periodAccounts);
  const loanRepayAcc     = getAccount("1700", periodAccounts);
  const drawingsAcc      = getAccount("3200", periodAccounts);
  const capitalAcc       = getAccount("3000", periodAccounts);

  const loanProceeds        = loanProceedsAcc ? balance(loanProceedsAcc) : 0;
  const loanRepayments      = loanRepayAcc ? -balance(loanRepayAcc) : 0;
  const drawings            = drawingsAcc ? -balance(drawingsAcc) : 0;
  const capitalContributions = capitalAcc ? balance(capitalAcc) : 0;
  const netFinancing = loanProceeds + loanRepayments + drawings + capitalContributions;

  const cashAccPrior  = getAccount("1000", allAccounts);
  const openingCash   = cashAccPrior ? balance(cashAccPrior) : 0;
  const netCashChange = netOperating + netInvesting + netFinancing;
  const closingCash   = openingCash + netCashChange;

  return {
    netIncome, depreciation, changeInAR, changeInInventory,
    changeInAP, changeInWagesPayable, netOperating,
    ppePurchases, netInvesting,
    loanProceeds, loanRepayments, drawings, capitalContributions, netFinancing,
    netCashChange, openingCash, closingCash,
  };
}

export async function getCashFlowStatement(
  startDate: Date, endDate: Date,
  priorStartDate?: Date, priorEndDate?: Date,
): Promise<CashFlowStatement | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const current = await computeCashFlow(owner.id, startDate, endDate);

  let prior: Omit<CashFlowStatement, 'period' | 'prior'> | undefined;
  if (priorStartDate && priorEndDate) {
    prior = await computeCashFlow(owner.id, priorStartDate, priorEndDate);
  }

  return { period: { startDate, endDate }, ...current, prior };
}

// ── Statement of Retained Earnings ────────────────────────────────────────────

export interface RetainedEarningsStatement {
  period:          { startDate: Date; endDate: Date };
  openingRE:       number;
  netIncome:       number;
  drawings:        number;
  closingRE:       number;
  prior?: {
    openingRE:  number;
    netIncome:  number;
    drawings:   number;
    closingRE:  number;
  };
}

export async function getRetainedEarningsStatement(
  startDate: Date,
  endDate: Date,
  priorStartDate?: Date,
  priorEndDate?: Date,
): Promise<RetainedEarningsStatement | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;
  const tenantId = owner.id;

  async function computeForPeriod(start: Date, end: Date) {
    const dayBefore   = new Date(start.getTime() - 86400000);
    const preAccounts = await getAccountsWithLines(tenantId, undefined, dayBefore);
    const reAcc       = preAccounts.find(a => a.code === "3100");
    const openingRE   = reAcc ? balance(reAcc) : 0;

    const periodAccounts = await getAccountsWithLines(tenantId, start, end);
    const revenue    = periodAccounts.filter(a => a.type === "Revenue")     .reduce((s, a) => s + balance(a), 0);
    const cos        = periodAccounts.filter(a => a.type === "CostOfSales") .reduce((s, a) => s + balance(a), 0);
    const expenses   = periodAccounts.filter(a => a.type === "Expense")     .reduce((s, a) => s + balance(a), 0);
    const nonOp      = periodAccounts.filter(a => a.type === "NonOperating").reduce((s, a) => {
      const b = balance(a);
      return s + (a.code.startsWith("44") ? b : -b);
    }, 0);
    const netIncome  = revenue - cos - expenses + nonOp;

    const drawingsAcc = periodAccounts.find(a => a.code === "3200");
    const drawings    = drawingsAcc ? balance(drawingsAcc) : 0;

    const closingRE   = openingRE + netIncome - drawings;
    return { openingRE, netIncome, drawings, closingRE };
  }

  const current = await computeForPeriod(startDate, endDate);
  const prior   = priorStartDate && priorEndDate
    ? await computeForPeriod(priorStartDate, priorEndDate)
    : undefined;

  return {
    period: { startDate, endDate },
    ...current,
    prior,
  };
}

// ── Finance Dashboard metrics ─────────────────────────────────────────────────

export async function getFinanceDashboard() {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const now   = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const yStart = new Date(now.getFullYear(), 0, 1);

  const [monthAccounts, ytdAccounts, allAccounts] = await Promise.all([
    getAccountsWithLines(owner.id, mStart, mEnd),
    getAccountsWithLines(owner.id, yStart, now),
    getAccountsWithLines(owner.id, undefined, now),
  ]);

  function sum(type: string, accs: AccountRow[]) {
    return accs.filter(a => a.type === type).reduce((s, a) => s + balance(a), 0);
  }
  function acct(code: string, accs: AccountRow[]) {
    const a = accs.find(x => x.code === code);
    return a ? balance(a) : 0;
  }

  const ytdRevenue   = sum("Revenue", ytdAccounts);
  const ytdCoS       = sum("CostOfSales", ytdAccounts);
  const ytdExpenses  = sum("Expense", ytdAccounts);
  const ytdNetIncome = ytdRevenue - ytdCoS - ytdExpenses;

  const mRevenue   = sum("Revenue", monthAccounts);
  const mExpenses  = sum("Expense", monthAccounts) + sum("CostOfSales", monthAccounts);
  const mNetIncome = mRevenue - mExpenses;

  const cash        = acct("1000", allAccounts);
  const ar          = acct("1100", allAccounts);
  const ap          = acct("2000", allAccounts);
  const inventory   = acct("1200", allAccounts);
  const currentLiab = allAccounts.filter(a => a.type === "Liability" && a.code < "2400")
    .reduce((s, a) => s + balance(a), 0);
  const currentAssets = allAccounts.filter(a => a.type === "Asset" && a.code < "1500")
    .reduce((s, a) => s + (a.isContra ? -balance(a) : balance(a)), 0);

  const currentRatio = currentLiab > 0 ? currentAssets / currentLiab : null;
  const quickRatio   = currentLiab > 0 ? (cash + ar) / currentLiab : null;

  const arEntries = await prisma.journalEntryLine.findMany({
    where: { account: { tenantId: owner.id, code: "1100" } },
    include: { journalEntry: { select: { date: true, sourceType: true } } },
  });
  const arBalance = arEntries.reduce((s, l) => s + toNum(l.debit) - toNum(l.credit), 0);
  const arOver30  = arEntries.filter(l => {
    const age = (Date.now() - new Date(l.journalEntry.date).getTime()) / 86400000;
    return l.journalEntry.sourceType === "invoice" && age > 30 && toNum(l.debit) > 0;
  }).reduce((s, l) => s + toNum(l.debit), 0);

  return {
    mRevenue, mExpenses, mNetIncome,
    ytdRevenue, ytdCoS, ytdExpenses, ytdNetIncome,
    ytdGrossMargin: ytdRevenue > 0 ? ((ytdRevenue - ytdCoS) / ytdRevenue) * 100 : 0,
    ytdNetMargin:   ytdRevenue > 0 ? (ytdNetIncome / ytdRevenue) * 100 : 0,
    cash, ar, ap, inventory,
    currentRatio, quickRatio,
    arBalance, arOver30,
  };
}
