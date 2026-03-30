import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { IncomeStatement, PLLine } from "@/lib/actions/accounting/statements";

const C = {
  primary:  "#4F6EF7",
  dark:     "#111827",
  gray:     "#374151",
  muted:    "#6b7280",
  light:    "#f9fafb",
  border:   "#e5e7eb",
  red:      "#dc2626",
  green:    "#059669",
};

const s = StyleSheet.create({
  page:         { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: C.dark, backgroundColor: "#fff" },
  // Header
  header:       { marginBottom: 20 },
  company:      { fontSize: 8, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  docTitle:     { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 2 },
  periodLine:   { fontSize: 8, color: C.muted },
  divider:      { borderBottomWidth: 1.5, borderBottomColor: C.primary, marginTop: 10, marginBottom: 16 },
  // Summary strip
  summaryStrip: { flexDirection: "row", gap: 8, marginBottom: 20 },
  summaryBox:   { flex: 1, backgroundColor: C.light, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: C.border },
  summaryLabel: { fontSize: 7, color: C.muted, marginBottom: 3 },
  summaryVal:   { fontSize: 11, fontFamily: "Helvetica-Bold" },
  // Section
  section:      { marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  lineRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4 },
  lineCode:     { width: 36, color: C.muted },
  lineName:     { flex: 1 },
  lineAmt:      { width: 72, textAlign: "right" },
  subtotalRow:  { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.gray, paddingVertical: 4, marginTop: 1 },
  subtotalLabel:{ flex: 1, fontFamily: "Helvetica-Bold" },
  subtotalAmt:  { width: 72, textAlign: "right", fontFamily: "Helvetica-Bold" },
  // Summary rows
  summaryRow:   { flexDirection: "row", alignItems: "center", backgroundColor: C.light, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 4 },
  summaryRowBold:{ flexDirection: "row", alignItems: "center", backgroundColor: "#e0e7ff", borderRadius: 4, paddingVertical: 8, paddingHorizontal: 8, marginBottom: 4 },
  summaryRLabel:{ flex: 1, fontFamily: "Helvetica-Bold", fontSize: 9 },
  summaryRPct:  { width: 70, color: C.muted, textAlign: "right", fontSize: 8 },
  summaryRAmt:  { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9 },
  // Footer
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText:   { fontSize: 7, color: C.muted },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props { data: IncomeStatement; companyName: string }

export function PLPdfTemplate({ data, companyName }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.company}>{companyName}</Text>
          <Text style={s.docTitle}>Profit &amp; Loss Statement</Text>
          <Text style={s.periodLine}>
            For the period {fmtDate(data.period.startDate)} – {fmtDate(data.period.endDate)}
          </Text>
        </View>
        <View style={s.divider} />

        {/* Summary strip */}
        <View style={s.summaryStrip}>
          {[
            { label: "Total Revenue",   val: data.totalRevenue,    color: C.green  },
            { label: "Total Expenses",  val: data.totalCostOfSales + data.totalOpExpenses, color: C.red },
            { label: "Net Income",      val: data.netIncome,       color: data.netIncome >= 0 ? C.primary : C.red },
            { label: "Net Margin",      val: null, pct: `${data.netMargin.toFixed(1)}%`, color: data.netMargin >= 0 ? C.primary : C.red },
          ].map((item) => (
            <View key={item.label} style={s.summaryBox}>
              <Text style={s.summaryLabel}>{item.label}</Text>
              <Text style={[s.summaryVal, { color: item.color }]}>
                {item.val !== null ? fmt(item.val) : item.pct}
              </Text>
            </View>
          ))}
        </View>

        {/* Revenue */}
        <PLSection title="Revenue" lines={data.revenue} total={data.totalRevenue} />

        {/* Cost of Sales */}
        <PLSection title="Cost of Sales" lines={data.costOfSales} total={data.totalCostOfSales} />

        {/* Gross Profit */}
        <View style={s.summaryRow}>
          <Text style={s.summaryRLabel}>Gross Profit</Text>
          <Text style={s.summaryRPct}>{data.grossMargin.toFixed(1)}% margin</Text>
          <Text style={[s.summaryRAmt, { color: data.grossProfit < 0 ? C.red : C.dark }]}>{fmt(data.grossProfit)}</Text>
        </View>

        {/* Operating Expenses */}
        <PLSection title="Operating Expenses" lines={data.opExpenses} total={data.totalOpExpenses} />

        {/* Operating Income */}
        <View style={s.summaryRow}>
          <Text style={s.summaryRLabel}>Operating Income</Text>
          <Text style={s.summaryRPct}>{data.operatingMargin.toFixed(1)}% margin</Text>
          <Text style={[s.summaryRAmt, { color: data.operatingIncome < 0 ? C.red : C.dark }]}>{fmt(data.operatingIncome)}</Text>
        </View>

        {/* Non-Operating */}
        {data.nonOperating.length > 0 && (
          <PLSection title="Non-Operating Items" lines={data.nonOperating} total={data.totalNonOperating} />
        )}

        {/* Net Income */}
        <View style={s.summaryRowBold}>
          <Text style={[s.summaryRLabel, { fontSize: 10 }]}>Net Income</Text>
          <Text style={[s.summaryRPct, { fontSize: 9 }]}>{data.netMargin.toFixed(1)}% net margin</Text>
          <Text style={[s.summaryRAmt, { fontSize: 10, color: data.netIncome < 0 ? C.red : C.primary }]}>{fmt(data.netIncome)}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated {fmtDate(new Date())}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function PLSection({ title, lines, total }: { title: string; lines: PLLine[]; total: number }) {
  if (lines.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {lines.map((l) => (
        <View key={l.code} style={s.lineRow}>
          <Text style={[s.lineCode, { fontSize: 8 }]}>{l.code}</Text>
          <Text style={s.lineName}>{l.name}</Text>
          <Text style={s.lineAmt}>{fmt(l.amount)}</Text>
        </View>
      ))}
      <View style={s.subtotalRow}>
        <Text style={s.subtotalLabel}>Total {title}</Text>
        <Text style={s.subtotalAmt}>{fmt(total)}</Text>
      </View>
    </View>
  );
}
