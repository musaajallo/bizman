import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getBudgetExportData } from "@/lib/actions/budgets";
import { BudgetPdfTemplate } from "@/components/budgets/budget-pdf-template";
import React from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const data = await getBudgetExportData(id);
  if (!data) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  try {
    const element = React.createElement(BudgetPdfTemplate, { data });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="budget-${slug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[api/budgets/pdf] failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
