import { NextRequest, NextResponse } from "next/server";
import { getBalanceSheet } from "@/lib/actions/accounting/statements";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import type { BSLine } from "@/lib/actions/accounting/statements";

function c(...vals: (string | number)[]): string {
  return vals
    .map((v) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function num(n: number) {
  return n.toFixed(2);
}

function sumLines(lines: BSLine[]) {
  return lines.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const defaultAsOf = new Date().toISOString().split("T")[0];
  const asOfStr = searchParams.get("asOf") ?? defaultAsOf;

  const [owner, data] = await Promise.all([
    getOwnerBusiness(),
    getBalanceSheet(new Date(asOfStr)),
  ]);

  if (!data) {
    return NextResponse.json({ error: "No data for the selected date" }, { status: 404 });
  }

  const companyName = owner?.name ?? "Company";
  const rows: string[] = [];

  // Header
  rows.push(c("Balance Sheet"));
  rows.push(c("Company", companyName));
  rows.push(c("As of", fmtDate(data.asOf)));
  rows.push(c("Generated", fmtDate(new Date())));
  rows.push(c("Balanced", data.balanced ? "Yes" : "No"));
  rows.push("");

  // Column headers
  rows.push(c("Section", "Code", "Account Name", "Amount", "Contra"));

  // Current Assets
  for (const l of data.currentAssets) {
    rows.push(c("Current Assets", l.code, l.name, l.isContra ? num(-l.amount) : num(l.amount), l.isContra ? "Yes" : "No"));
  }
  rows.push(c("TOTAL CURRENT ASSETS", "", "", num(sumLines(data.currentAssets)), ""));
  rows.push("");

  // Non-Current Assets
  for (const l of data.nonCurrentAssets) {
    rows.push(c("Non-Current Assets", l.code, l.name, l.isContra ? num(-l.amount) : num(l.amount), l.isContra ? "Yes" : "No"));
  }
  rows.push(c("TOTAL NON-CURRENT ASSETS", "", "", num(sumLines(data.nonCurrentAssets)), ""));
  rows.push("");

  rows.push(c("TOTAL ASSETS", "", "", num(data.totalAssets), ""));
  rows.push("");

  // Current Liabilities
  for (const l of data.currentLiabilities) {
    rows.push(c("Current Liabilities", l.code, l.name, num(l.amount), "No"));
  }
  rows.push(c("TOTAL CURRENT LIABILITIES", "", "", num(sumLines(data.currentLiabilities)), ""));
  rows.push("");

  // Non-Current Liabilities
  for (const l of data.nonCurrentLiabilities) {
    rows.push(c("Non-Current Liabilities", l.code, l.name, num(l.amount), "No"));
  }
  rows.push(c("TOTAL NON-CURRENT LIABILITIES", "", "", num(sumLines(data.nonCurrentLiabilities)), ""));
  rows.push("");

  rows.push(c("TOTAL LIABILITIES", "", "", num(data.totalLiabilities), ""));
  rows.push("");

  // Equity
  for (const l of data.equity) {
    rows.push(c("Equity", l.code, l.name, l.isContra ? num(-l.amount) : num(l.amount), l.isContra ? "Yes" : "No"));
  }
  rows.push(c("Equity", "", "Retained Earnings (net income)", num(data.retainedNetIncome), "No"));
  rows.push(c("TOTAL EQUITY", "", "", num(data.totalEquity), ""));
  rows.push("");

  rows.push(c("TOTAL LIABILITIES + EQUITY", "", "", num(data.totalLiabEquity), ""));

  const csv = rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="balance-sheet-${asOfStr}.csv"`,
    },
  });
}
