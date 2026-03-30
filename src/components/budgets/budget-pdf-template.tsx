import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  meta: { fontSize: 8, color: "#6b7280" },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 3 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 5 },
  headerRow: { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  colLabel: { flex: 2.5 },
  colType: { flex: 1.5 },
  colNum: { flex: 1.5, textAlign: "right" },
  headerText: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#374151" },
  cellText: { fontSize: 8 },
  muted: { color: "#6b7280" },
  overBudget: { color: "#dc2626" },
  underBudget: { color: "#059669" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { fontSize: 8, color: "#6b7280" },
  summaryValue: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  totalRow: { flexDirection: "row", paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: "#374151", marginTop: 2 },
  totalLabel: { flex: 4, fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalValue: { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9 },
  statusBadge: { fontSize: 7, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#9ca3af" },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface BudgetLine {
  label: string;
  lineType: string;
  allocated: number;
  actual: number;
  variance: number;
}

interface BudgetExportData {
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  currency: string;
  status: string;
  lines: BudgetLine[];
  totals: { allocated: number; actual: number };
  actuals: { totalExpenses: number; totalBills: number; totalPayroll: number };
}

export function BudgetPdfTemplate({ data }: { data: BudgetExportData }) {
  const totalVariance = data.totals.allocated - data.totals.actual;

  const fmt_date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>{data.name}</Text>
        {data.description && <Text style={styles.subtitle}>{data.description}</Text>}
        <Text style={styles.meta}>
          Period: {fmt_date(data.startDate)} – {fmt_date(data.endDate)}{"  "}|{"  "}
          Currency: {data.currency}{"  "}|{"  "}
          Status: {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </Text>

        {/* Summary cards */}
        <View style={[styles.section, { flexDirection: "row", gap: 8 }]}>
          {[
            { label: "Total Allocated", value: `${data.currency} ${fmt(data.totals.allocated)}` },
            { label: "Total Actual", value: `${data.currency} ${fmt(data.totals.actual)}` },
            {
              label: "Variance",
              value: `${totalVariance >= 0 ? "+" : ""}${data.currency} ${fmt(Math.abs(totalVariance))}`,
              over: totalVariance < 0,
            },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 4, padding: 8, borderWidth: 1, borderColor: "#e5e7eb" }}>
              <Text style={[styles.meta, { marginBottom: 3 }]}>{s.label}</Text>
              <Text style={[{ fontSize: 11, fontFamily: "Helvetica-Bold" }, s.over ? styles.overBudget : s.label === "Variance" ? styles.underBudget : {}]}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Budget lines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Lines</Text>

          <View style={styles.headerRow}>
            <View style={styles.colLabel}><Text style={styles.headerText}>Line Item</Text></View>
            <View style={styles.colType}><Text style={styles.headerText}>Type</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Allocated</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Actual</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Variance</Text></View>
            <View style={[styles.colNum, { flex: 0.8 }]}><Text style={styles.headerText}>% Used</Text></View>
          </View>

          {data.lines.map((l, i) => {
            const pct = l.allocated > 0 ? Math.round((l.actual / l.allocated) * 100) : 0;
            return (
              <View key={i} style={styles.row}>
                <View style={styles.colLabel}><Text style={styles.cellText}>{l.label}</Text></View>
                <View style={styles.colType}><Text style={[styles.cellText, styles.muted, { textTransform: "capitalize" }]}>{l.lineType}</Text></View>
                <View style={styles.colNum}><Text style={styles.cellText}>{fmt(l.allocated)}</Text></View>
                <View style={styles.colNum}><Text style={styles.cellText}>{fmt(l.actual)}</Text></View>
                <View style={styles.colNum}>
                  <Text style={[styles.cellText, l.variance < 0 ? styles.overBudget : styles.underBudget]}>
                    {l.variance >= 0 ? "+" : ""}{fmt(l.variance)}
                  </Text>
                </View>
                <View style={[styles.colNum, { flex: 0.8 }]}>
                  <Text style={[styles.cellText, pct > 100 ? styles.overBudget : pct > 80 ? { color: "#d97706" } : styles.muted]}>
                    {pct}%
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Totals row */}
          <View style={styles.totalRow}>
            <View style={styles.colLabel}><Text style={[styles.totalLabel]}>TOTAL</Text></View>
            <View style={styles.colType}><Text style={{}} /></View>
            <View style={styles.colNum}><Text style={styles.totalValue}>{fmt(data.totals.allocated)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalValue}>{fmt(data.totals.actual)}</Text></View>
            <View style={styles.colNum}>
              <Text style={[styles.totalValue, totalVariance < 0 ? styles.overBudget : styles.underBudget]}>
                {totalVariance >= 0 ? "+" : ""}{fmt(Math.abs(totalVariance))}
              </Text>
            </View>
            <View style={[styles.colNum, { flex: 0.8 }]}><Text style={{}} /></View>
          </View>
        </View>

        {/* Actuals breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actuals Breakdown</Text>
          {[
            { label: "Expenses", value: data.actuals.totalExpenses },
            { label: "Bills", value: data.actuals.totalBills },
            { label: "Payroll", value: data.actuals.totalPayroll },
          ].map((s) => (
            <View key={s.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{s.label}</Text>
              <Text style={styles.summaryValue}>{data.currency} {fmt(s.value)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
