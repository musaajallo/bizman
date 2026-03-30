import { NextRequest, NextResponse } from "next/server";
import { getIncomeStatement } from "@/lib/actions/accounting/statements";
import { getOwnerBusiness } from "@/lib/actions/tenants";

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const fromStr = searchParams.get("from") ?? defaultFrom;
  const toStr   = searchParams.get("to")   ?? defaultTo;

  const [owner, data] = await Promise.all([
    getOwnerBusiness(),
    getIncomeStatement(new Date(fromStr), new Date(toStr)),
  ]);

  if (!data) {
    return NextResponse.json({ error: "No data for the selected period" }, { status: 404 });
  }

  const companyName = owner?.name ?? "Company";
  const rows: string[] = [];

  // Header
  rows.push(c("Profit & Loss Statement"));
  rows.push(c("Company", companyName));
  rows.push(c("Period", `${fmtDate(data.period.startDate)} – ${fmtDate(data.period.endDate)}`));
  rows.push(c("Generated", fmtDate(new Date())));
  rows.push("");

  // Column headers
  rows.push(c("Section", "Code", "Account Name", "Amount"));

  // Revenue
  for (const l of data.revenue) {
    rows.push(c("Revenue", l.code, l.name, num(l.amount)));
  }
  rows.push(c("TOTAL REVENUE", "", "", num(data.totalRevenue)));
  rows.push("");

  // Cost of Sales
  for (const l of data.costOfSales) {
    rows.push(c("Cost of Sales", l.code, l.name, num(l.amount)));
  }
  if (data.costOfSales.length > 0) {
    rows.push(c("TOTAL COST OF SALES", "", "", num(data.totalCostOfSales)));
    rows.push("");
  }

  // Gross Profit
  rows.push(c("GROSS PROFIT", "", "", num(data.grossProfit)));
  rows.push(c("Gross Margin", "", "", `${data.grossMargin.toFixed(1)}%`));
  rows.push("");

  // Operating Expenses
  for (const l of data.opExpenses) {
    rows.push(c("Operating Expenses", l.code, l.name, num(l.amount)));
  }
  if (data.opExpenses.length > 0) {
    rows.push(c("TOTAL OPERATING EXPENSES", "", "", num(data.totalOpExpenses)));
    rows.push("");
  }

  // Operating Income
  rows.push(c("OPERATING INCOME", "", "", num(data.operatingIncome)));
  rows.push(c("Operating Margin", "", "", `${data.operatingMargin.toFixed(1)}%`));
  rows.push("");

  // Non-Operating
  for (const l of data.nonOperating) {
    rows.push(c("Non-Operating", l.code, l.name, num(l.amount)));
  }
  if (data.nonOperating.length > 0) {
    rows.push(c("TOTAL NON-OPERATING", "", "", num(data.totalNonOperating)));
    rows.push("");
  }

  // Net Income
  rows.push(c("NET INCOME", "", "", num(data.netIncome)));
  rows.push(c("Net Margin", "", "", `${data.netMargin.toFixed(1)}%`));

  const csv = rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="profit-loss-${fromStr}-to-${toStr}.csv"`,
    },
  });
}
