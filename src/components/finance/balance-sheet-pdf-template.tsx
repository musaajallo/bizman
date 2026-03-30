import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { BalanceSheet, BSLine } from "@/lib/actions/accounting/statements";

const C = {
  primary: "#4F6EF7",
  dark:    "#111827",
  gray:    "#374151",
  muted:   "#6b7280",
  light:   "#f9fafb",
  border:  "#e5e7eb",
  red:     "#dc2626",
  green:   "#059669",
};

const s = StyleSheet.create({
  page:         { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: C.dark, backgroundColor: "#fff" },
  header:       { marginBottom: 20 },
  company:      { fontSize: 8, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  docTitle:     { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 2 },
  asOfLine:     { fontSize: 8, color: C.muted },
  divider:      { borderBottomWidth: 1.5, borderBottomColor: C.primary, marginTop: 10, marginBottom: 16 },
  balanced:     { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  balancedText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  columns:      { flexDirection: "row", gap: 16 },
  column:       { flex: 1 },
  colTitle:     { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  section:      { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  lineRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 3 },
  lineCode:     { width: 28, color: C.muted, fontSize: 7 },
  lineName:     { flex: 1, fontSize: 8 },
  lineAmt:      { width: 60, textAlign: "right", fontSize: 8 },
  subtotalRow:  { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.gray, paddingVertical: 3, marginTop: 1 },
  subtotalLabel:{ flex: 1, fontFamily: "Helvetica-Bold", fontSize: 8 },
  subtotalAmt:  { width: 60, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 8 },
  totalRow:     { flexDirection: "row", backgroundColor: C.light, borderRadius: 3, paddingVertical: 5, paddingHorizontal: 4, marginTop: 6 },
  totalLabel:   { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalAmt:     { width: 60, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9 },
  retainedRow:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 3 },
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText:   { fontSize: 7, color: C.muted },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sumLines(lines: BSLine[]) {
  return lines.reduce((s, l) => s + (l.isContra ? -l.amount : l.amount), 0);
}

interface Props { data: BalanceSheet; companyName: string }

export function BalanceSheetPdfTemplate({ data, companyName }: Props) {
  const totalCurrentAssets    = sumLines(data.currentAssets);
  const totalNonCurrentAssets = sumLines(data.nonCurrentAssets);
  const totalCurrentLiab      = sumLines(data.currentLiabilities);
  const totalNonCurrentLiab   = sumLines(data.nonCurrentLiabilities);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.company}>{companyName}</Text>
          <Text style={s.docTitle}>Balance Sheet</Text>
          <Text style={s.asOfLine}>As of {fmtDate(data.asOf)}</Text>
        </View>
        <View style={s.divider} />

        {/* Balanced indicator */}
        <View style={s.balanced}>
          <Text style={[s.balancedText, { color: data.balanced ? C.green : C.red }]}>
            {data.balanced ? "✓  Balanced" : "✗  Out of Balance"}
          </Text>
          {!data.balanced && (
            <Text style={{ fontSize: 8, color: C.muted, marginLeft: 8 }}>
              Difference: {fmt(Math.abs(data.totalAssets - data.totalLiabEquity))}
            </Text>
          )}
        </View>

        {/* Two columns */}
        <View style={s.columns}>
          {/* ASSETS */}
          <View style={s.column}>
            <Text style={s.colTitle}>Assets</Text>

            {data.currentAssets.length > 0 && (
              <BSSection title="Current Assets" lines={data.currentAssets} total={totalCurrentAssets} />
            )}
            {data.nonCurrentAssets.length > 0 && (
              <BSSection title="Non-Current Assets" lines={data.nonCurrentAssets} total={totalNonCurrentAssets} />
            )}

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL ASSETS</Text>
              <Text style={s.totalAmt}>{fmt(data.totalAssets)}</Text>
            </View>
          </View>

          {/* LIABILITIES + EQUITY */}
          <View style={s.column}>
            <Text style={s.colTitle}>Liabilities &amp; Equity</Text>

            {data.currentLiabilities.length > 0 && (
              <BSSection title="Current Liabilities" lines={data.currentLiabilities} total={totalCurrentLiab} />
            )}
            {data.nonCurrentLiabilities.length > 0 && (
              <BSSection title="Non-Current Liabilities" lines={data.nonCurrentLiabilities} total={totalNonCurrentLiab} />
            )}

            <View style={[s.subtotalRow, { marginBottom: 8 }]}>
              <Text style={s.subtotalLabel}>Total Liabilities</Text>
              <Text style={s.subtotalAmt}>{fmt(data.totalLiabilities)}</Text>
            </View>

            {/* Equity */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Equity</Text>
              {data.equity.map((l) => (
                <View key={l.code} style={s.lineRow}>
                  <Text style={[s.lineCode, { fontSize: 7 }]}>{l.code}</Text>
                  <Text style={s.lineName}>{l.name}{l.isContra ? " (contra)" : ""}</Text>
                  <Text style={s.lineAmt}>{l.isContra ? `(${fmt(l.amount)})` : fmt(l.amount)}</Text>
                </View>
              ))}
              <View style={s.retainedRow}>
                <Text style={[s.lineName, { paddingLeft: 28 }]}>Retained Earnings (net income)</Text>
                <Text style={[s.lineAmt, { color: data.retainedNetIncome < 0 ? C.red : C.dark }]}>
                  {fmt(data.retainedNetIncome)}
                </Text>
              </View>
              <View style={s.subtotalRow}>
                <Text style={s.subtotalLabel}>Total Equity</Text>
                <Text style={s.subtotalAmt}>{fmt(data.totalEquity)}</Text>
              </View>
            </View>

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL LIAB + EQUITY</Text>
              <Text style={s.totalAmt}>{fmt(data.totalLiabEquity)}</Text>
            </View>
          </View>
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

function BSSection({ title, lines, total }: { title: string; lines: BSLine[]; total: number }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {lines.map((l) => (
        <View key={l.code} style={s.lineRow}>
          <Text style={[s.lineCode, { fontSize: 7 }]}>{l.code}</Text>
          <Text style={s.lineName}>{l.name}</Text>
          <Text style={s.lineAmt}>{l.isContra ? `(${fmt(l.amount)})` : fmt(l.amount)}</Text>
        </View>
      ))}
      <View style={s.subtotalRow}>
        <Text style={s.subtotalLabel}>Total {title}</Text>
        <Text style={s.subtotalAmt}>{fmt(total)}</Text>
      </View>
    </View>
  );
}
