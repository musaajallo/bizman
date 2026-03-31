import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getForecastData } from "@/lib/actions/accounting/forecasting";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { ForecastPdfTemplate } from "@/components/accounting/forecast-pdf-template";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const scenarioName = searchParams.get("scenario") ?? "Base";

  const [owner, data] = await Promise.all([
    getOwnerBusiness(),
    getForecastData(),
  ]);

  if (!data) {
    return NextResponse.json({ error: "No forecast data" }, { status: 404 });
  }

  const scenario =
    data.scenarios.find((s) => s.scenarioName.toLowerCase() === scenarioName.toLowerCase()) ??
    data.scenarios[0];

  try {
    const element = React.createElement(ForecastPdfTemplate, {
      scenario,
      historicalMonths: data.historicalMonths,
      startingCash:     data.startingCash,
      companyName:      owner?.name ?? "Company",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="forecast-${scenario.scenarioName.toLowerCase()}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[api/forecast/pdf] failed", String(err));
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
