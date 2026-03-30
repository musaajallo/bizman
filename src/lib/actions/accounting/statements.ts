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

export interface IncomeStatement {
  period: { startDate: Date; endDate: Date };
  revenue:          PLLine[];
  totalRevenue:     number;
  costOfSales:      PLLine[];
  totalCostOfSales: number;
  grossProfit:      number;
  grossMargin:      number;
  opExpenses:       PLLine[];
  totalOpExpenses:  number;
  operatingIncome:  number;
  operatingMargin:  number;
  nonOperating:     PLLine[];
  totalNonOperating:number;
  netIncome:        number;
  netMargin:        number;
}

export async function getIncomeStatement(startDate: Date, endDate: Date): Promise<IncomeStatement | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const accounts = await getAccountsWithLines(owner.id, startDate, endDate);

  const revenue      = accounts.filter(a => a.type === "Revenue")      .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);
  const costOfSales  = accounts.filter(a => a.type === "CostOfSales")  .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);
  const opExpenses   = accounts.filter(a => a.type === "Expense")      .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);
  const nonOperating = accounts.filter(a => a.type === "NonOperating") .map(a => ({ code: a.code, name: a.name, amount: balance(a) })).filter(r => r.amount !== 0);

  const totalRevenue      = revenue.reduce((s, r) => s + r.amount, 0);
  const totalCostOfSales  = costOfSales.reduce((s, r) => s + r.amount, 0);
  const grossProfit       = totalRevenue - totalCostOfSales;
  const totalOpExpenses   = opExpenses.reduce((s, r) => s + r.amount, 0);
  const operatingIncome   = grossProfit - totalOpExpenses;
  const totalNonOperating = nonOperating.reduce((s, r) => s + (r.amount * (r.code.startsWith("44") ? 1 : -1)), 0);
  const netIncome         = operatingIncome + totalNonOperating;

  return {
    period:           { startDate, endDate },
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

// ── Balance Sheet ─────────────────────────────────────────────────────────────

export interface BSLine { code: string; name: string; amount: number; isContra: boolean }

export interface BalanceSheet {
  asOf: Date;
  currentAssets:       BSLine[];
  nonCurrentAssets:    BSLine[];
  totalAssets:         number;
  currentLiabilities:  BSLine[];
  nonCurrentLiabilities:BSLine[];
  totalLiabilities:    number;
  equity:              BSLine[];
  retainedNetIncome:   number;  // net income from all time (to close into retained earnings)
  totalEquity:         number;
  totalLiabEquity:     number;
  balanced:            boolean;
}

export async function getBalanceSheet(asOf: Date): Promise<BalanceSheet | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  // All entries up to asOf
  const accounts = await getAccountsWithLines(owner.id, undefined, asOf);

  function mapLines(accs: AccountRow[]): BSLine[] {
    return accs.map(a => ({ code: a.code, name: a.name, amount: Math.abs(balance(a)), isContra: a.isContra }))
      .filter(r => r.amount !== 0);
  }

  const currentAssets       = mapLines(accounts.filter(a => a.type === "Asset"     && a.code <  "1500"));
  const nonCurrentAssets    = mapLines(accounts.filter(a => a.type === "Asset"     && a.code >= "1500"));
  const currentLiabilities  = mapLines(accounts.filter(a => a.type === "Liability" && a.code <  "2400"));
  const nonCurrentLiabilities = mapLines(accounts.filter(a => a.type === "Liability" && a.code >= "2400"));
  const equityAccounts      = mapLines(accounts.filter(a => a.type === "Equity"));

  // Assets: contra-accounts reduce the total
  const sumAssets = (lines: BSLine[]) =>
    lines.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);
  const sumLiab = (lines: BSLine[]) =>
    lines.reduce((s, l) => s + l.amount, 0);

  const totalCurrentAssets       = sumAssets(currentAssets);
  const totalNonCurrentAssets    = sumAssets(nonCurrentAssets);
  const totalAssets               = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiabilities  = sumLiab(currentLiabilities);
  const totalNonCurrentLiabilities = sumLiab(nonCurrentLiabilities);
  const totalLiabilities          = totalCurrentLiabilities + totalNonCurrentLiabilities;

  // Equity: sum equity accounts then add net income from P&L accounts
  const totalEquityAccounts = equityAccounts.reduce((s, l) => {
    // Drawings (3200) is a contra-equity debit account
    return s + (l.isContra ? -l.amount : l.amount);
  }, 0);

  // Net income = Revenue - CostOfSales - Expenses ± NonOperating
  const revenue      = accounts.filter(a => a.type === "Revenue")      .reduce((s, a) => s + balance(a), 0);
  const costOfSales  = accounts.filter(a => a.type === "CostOfSales")  .reduce((s, a) => s + balance(a), 0);
  const expenses     = accounts.filter(a => a.type === "Expense")      .reduce((s, a) => s + balance(a), 0);
  const nonOp        = accounts.filter(a => a.type === "NonOperating") .reduce((s, a) => {
    const b = balance(a);
    return s + (a.code.startsWith("44") ? b : -b);
  }, 0);
  const retainedNetIncome = revenue - costOfSales - expenses + nonOp;

  const totalEquity    = totalEquityAccounts + retainedNetIncome;
  const totalLiabEquity = totalLiabilities + totalEquity;

  return {
    asOf,
    currentAssets, nonCurrentAssets, totalAssets,
    currentLiabilities, nonCurrentLiabilities, totalLiabilities,
    equity: equityAccounts,
    retainedNetIncome,
    totalEquity,
    totalLiabEquity,
    balanced: Math.abs(totalAssets - totalLiabEquity) < 1,
  };
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
}

export async function getCashFlowStatement(startDate: Date, endDate: Date): Promise<CashFlowStatement | null> {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  const periodAccounts = await getAccountsWithLines(owner.id, startDate, endDate);
  const allAccounts    = await getAccountsWithLines(owner.id, undefined, new Date(startDate.getTime() - 1));

  function getAccount(code: string, accs: AccountRow[]) {
    return accs.find(a => a.code === code);
  }

  // Net income in period
  const revenue     = periodAccounts.filter(a => a.type === "Revenue")     .reduce((s, a) => s + balance(a), 0);
  const cos         = periodAccounts.filter(a => a.type === "CostOfSales") .reduce((s, a) => s + balance(a), 0);
  const expenses    = periodAccounts.filter(a => a.type === "Expense")     .reduce((s, a) => s + balance(a), 0);
  const netIncome   = revenue - cos - expenses;

  // Depreciation (non-cash add-back)
  const depAcc      = getAccount("6500", periodAccounts);
  const depreciation = depAcc ? balance(depAcc) : 0;

  // Working capital changes (period movement)
  function periodBalance(code: string) {
    const acc = getAccount(code, periodAccounts);
    return acc ? balance(acc) : 0;
  }

  const changeInAR           = -periodBalance("1100"); // increase = cash decrease
  const changeInInventory    = -periodBalance("1200");
  const changeInAP           = periodBalance("2000");  // increase = cash increase
  const changeInWagesPayable = periodBalance("2100");
  const netOperating = netIncome + depreciation + changeInAR + changeInInventory + changeInAP + changeInWagesPayable;

  // Investing — net movement in PP&E (1500) during period
  const ppeAcc      = getAccount("1500", periodAccounts);
  const ppePurchases = ppeAcc ? -balance(ppeAcc) : 0; // cash outflow
  const netInvesting = ppePurchases;

  // Financing
  const loanProceedsAcc  = getAccount("2400", periodAccounts);
  const loanRepayAcc     = getAccount("1700", periodAccounts); // loans receivable repaid
  const drawingsAcc      = getAccount("3200", periodAccounts);
  const capitalAcc       = getAccount("3000", periodAccounts);

  const loanProceeds        = loanProceedsAcc ? balance(loanProceedsAcc) : 0;
  const loanRepayments      = loanRepayAcc ? -balance(loanRepayAcc) : 0;
  const drawings            = drawingsAcc ? -balance(drawingsAcc) : 0;
  const capitalContributions = capitalAcc ? balance(capitalAcc) : 0;
  const netFinancing = loanProceeds + loanRepayments + drawings + capitalContributions;

  // Cash balances
  const cashAccPrior   = getAccount("1000", allAccounts);
  const openingCash    = cashAccPrior ? balance(cashAccPrior) : 0;
  const netCashChange  = netOperating + netInvesting + netFinancing;
  const closingCash    = openingCash + netCashChange;

  return {
    period: { startDate, endDate },
    netIncome, depreciation, changeInAR, changeInInventory,
    changeInAP, changeInWagesPayable, netOperating,
    ppePurchases, netInvesting,
    loanProceeds, loanRepayments, drawings, capitalContributions, netFinancing,
    netCashChange, openingCash, closingCash,
  };
}

// ── Finance Dashboard metrics ─────────────────────────────────────────────────

export async function getFinanceDashboard() {
  const owner = await getOwnerBusiness();
  if (!owner) return null;

  // Current month bounds
  const now   = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // YTD bounds
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

  // Balance sheet snapshot
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

  // AR aging (simple: outstanding entries older than 30 / 60 / 90 days)
  const arEntries = await prisma.journalEntryLine.findMany({
    where: { account: { tenantId: owner.id, code: "1100" } },
    include: { journalEntry: { select: { date: true, sourceType: true } } },
  });
  const arBalance     = arEntries.reduce((s, l) => s + toNum(l.debit) - toNum(l.credit), 0);
  const arOver30      = arEntries.filter(l => {
    const age = (Date.now() - new Date(l.journalEntry.date).getTime()) / 86400000;
    return l.journalEntry.sourceType === "invoice" && age > 30 && toNum(l.debit) > 0;
  }).reduce((s, l) => s + toNum(l.debit), 0);

  return {
    // Monthly
    mRevenue, mExpenses, mNetIncome,
    // YTD
    ytdRevenue, ytdCoS, ytdExpenses, ytdNetIncome,
    ytdGrossMargin: ytdRevenue > 0 ? ((ytdRevenue - ytdCoS) / ytdRevenue) * 100 : 0,
    ytdNetMargin:   ytdRevenue > 0 ? (ytdNetIncome / ytdRevenue) * 100 : 0,
    // Balance sheet
    cash, ar, ap, inventory,
    currentRatio, quickRatio,
    arBalance, arOver30,
  };
}
