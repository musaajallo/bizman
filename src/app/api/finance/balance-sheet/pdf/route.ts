import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getBalanceSheet } from "@/lib/actions/accounting/statements";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { BalanceSheetPdfTemplate } from "@/components/finance/balance-sheet-pdf-template";

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

  try {
    const element = React.createElement(BalanceSheetPdfTemplate, {
      data,
      companyName: owner?.name ?? "Company",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="balance-sheet-${asOfStr}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[api/finance/balance-sheet/pdf] failed", String(err));
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
