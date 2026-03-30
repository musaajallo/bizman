import { NextRequest, NextResponse } from "next/server";
import { getCashFlowStatement } from "@/lib/actions/accounting/statements";
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
    getCashFlowStatement(new Date(fromStr), new Date(toStr)),
  ]);

  if (!data) {
    return NextResponse.json({ error: "No data for the selected period" }, { status: 404 });
  }

  const companyName = owner?.name ?? "Company";
  const rows: string[] = [];

  // Header
  rows.push(c("Cash Flow Statement"));
  rows.push(c("Company", companyName));
  rows.push(c("Period", `${fmtDate(data.period.startDate)} – ${fmtDate(data.period.endDate)}`));
  rows.push(c("Method", "Indirect"));
  rows.push(c("Generated", fmtDate(new Date())));
  rows.push("");

  // Column headers
  rows.push(c("Section", "Item", "Amount"));

  // Operating
  rows.push(c("Operating Activities", "Net Income", num(data.netIncome)));
  rows.push(c("Operating Activities", "Depreciation (add-back)", num(data.depreciation)));
  rows.push(c("Operating Activities", "Change in Accounts Receivable", num(data.changeInAR)));
  rows.push(c("Operating Activities", "Change in Inventory", num(data.changeInInventory)));
  rows.push(c("Operating Activities", "Change in Accounts Payable", num(data.changeInAP)));
  rows.push(c("Operating Activities", "Change in Wages Payable", num(data.changeInWagesPayable)));
  rows.push(c("NET CASH FROM OPERATING", "", num(data.netOperating)));
  rows.push("");

  // Investing
  rows.push(c("Investing Activities", "PP&E Purchases / Disposals", num(data.ppePurchases)));
  rows.push(c("NET CASH FROM INVESTING", "", num(data.netInvesting)));
  rows.push("");

  // Financing
  rows.push(c("Financing Activities", "Loan Proceeds", num(data.loanProceeds)));
  rows.push(c("Financing Activities", "Loan Repayments", num(data.loanRepayments)));
  rows.push(c("Financing Activities", "Owner Drawings", num(data.drawings)));
  rows.push(c("Financing Activities", "Capital Contributions", num(data.capitalContributions)));
  rows.push(c("NET CASH FROM FINANCING", "", num(data.netFinancing)));
  rows.push("");

  // Summary
  rows.push(c("Summary", "Opening Cash Balance", num(data.openingCash)));
  rows.push(c("Summary", "Net Change in Cash", num(data.netCashChange)));
  rows.push(c("Summary", "Closing Cash Balance", num(data.closingCash)));

  const csv = rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cash-flow-${fromStr}-to-${toStr}.csv"`,
    },
  });
}
