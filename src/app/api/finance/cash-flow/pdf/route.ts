import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getCashFlowStatement } from "@/lib/actions/accounting/statements";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { CashFlowPdfTemplate } from "@/components/finance/cash-flow-pdf-template";

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

  try {
    const element = React.createElement(CashFlowPdfTemplate, {
      data,
      companyName: owner?.name ?? "Company",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cash-flow-${fromStr}-to-${toStr}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[api/finance/cash-flow/pdf] failed", String(err));
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
