import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ScenarioForecast, HistoricalMonth } from "@/lib/actions/accounting/forecasting";

const styles = StyleSheet.create({
  page:        { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
  title:       { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle:    { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  meta:        { fontSize: 8, color: "#6b7280" },
  section:     { marginTop: 14 },
  sectionTitle:{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 3 },
  headerRow:   { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  row:         { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 4 },
  totalRow:    { flexDirection: "row", paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: "#374151", marginTop: 2 },
  ht:          { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#374151" },
  cell:        { fontSize: 8 },
  muted:       { color: "#6b7280" },
  pos:         { color: "#059669" },
  neg:         { color: "#dc2626" },
  summaryBox:  { flex: 1, backgroundColor: "#f9fafb", borderRadius: 4, padding: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  summaryLabel:{ fontSize: 8, color: "#6b7280", marginBottom: 3 },
  summaryVal:  { fontSize: 11, fontFamily: "Helvetica-Bold" },
  footer:      { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between" },
  footerText:  { fontSize: 7, color: "#9ca3af" },
  // column widths
  cMonth:  { flex: 1.2 },
  cNum:    { flex: 1.2, textAlign: "right" },
  cNumSm:  { flex: 1, textAlign: "right" },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  scenario:        ScenarioForecast;
  historicalMonths: HistoricalMonth[];
  startingCash:    number;
  companyName:     string;
}

export function ForecastPdfTemplate({ scenario, historicalMonths, startingCash, companyName }: Props) {
  const totalVariance = scenario.totalRevenue - scenario.totalExpenses;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>12-Month Cash Flow Forecast</Text>
        <Text style={styles.subtitle}>{companyName}</Text>
        <Text style={styles.meta}>
          Scenario: {scenario.scenarioName}{"  "}|{"  "}
          Revenue ×{scenario.revenueMultiplier.toFixed(2)}{"  "}|{"  "}
          Expenses ×{scenario.expenseMultiplier.toFixed(2)}{"  "}|{"  "}
          Generated: {fmtDate(new Date().toISOString())}
        </Text>

        {/* Summary row */}
        <View style={[styles.section, { flexDirection: "row", gap: 8 }]}>
          {[
            { label: "Starting Cash",    value: fmt(startingCash),           color: undefined },
            { label: "Total Inflows",    value: fmt(scenario.totalRevenue),  color: styles.pos },
            { label: "Total Outflows",   value: fmt(scenario.totalExpenses), color: styles.neg },
            { label: "Ending Position",  value: fmt(scenario.endingCashPosition),
              color: scenario.endingCashPosition >= 0 ? styles.pos : styles.neg },
          ].map((s) => (
            <View key={s.label} style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{s.label}</Text>
              <Text style={[styles.summaryVal, s.color ?? {}]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Monthly forecast table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Forecast</Text>
          <View style={styles.headerRow}>
            <View style={styles.cMonth}><Text style={styles.ht}>Month</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Revenue</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Expenses</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Net Cash</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Cumulative</Text></View>
          </View>
          {scenario.months.map((m) => (
            <View key={m.month} style={styles.row}>
              <View style={styles.cMonth}><Text style={styles.cell}>{m.label}</Text></View>
              <View style={styles.cNum}><Text style={[styles.cell, styles.pos]}>{fmt(m.totalRevenue)}</Text></View>
              <View style={styles.cNum}><Text style={[styles.cell, styles.neg]}>{fmt(m.totalExpenses)}</Text></View>
              <View style={styles.cNum}>
                <Text style={[styles.cell, m.netCashFlow >= 0 ? styles.pos : styles.neg]}>
                  {m.netCashFlow >= 0 ? "+" : ""}{fmt(m.netCashFlow)}
                </Text>
              </View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.cumulativeCash)}</Text></View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <View style={styles.cMonth}><Text style={[styles.ht]}>TOTAL</Text></View>
            <View style={styles.cNum}><Text style={[styles.ht, styles.pos]}>{fmt(scenario.totalRevenue)}</Text></View>
            <View style={styles.cNum}><Text style={[styles.ht, styles.neg]}>{fmt(scenario.totalExpenses)}</Text></View>
            <View style={styles.cNum}>
              <Text style={[styles.ht, totalVariance >= 0 ? styles.pos : styles.neg]}>
                {totalVariance >= 0 ? "+" : ""}{fmt(totalVariance)}
              </Text>
            </View>
            <View style={styles.cNum} />
          </View>
        </View>

        {/* Revenue breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
          <View style={styles.headerRow}>
            <View style={styles.cMonth}><Text style={styles.ht}>Month</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Recurring</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Pipeline</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Trend</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Total</Text></View>
          </View>
          {scenario.months.map((m) => (
            <View key={m.month} style={styles.row}>
              <View style={styles.cMonth}><Text style={styles.cell}>{m.label}</Text></View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.recurringRevenue)}</Text></View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.pipelineRevenue)}</Text></View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.trendRevenue)}</Text></View>
              <View style={styles.cNum}><Text style={[styles.cell, styles.pos]}>{fmt(m.totalRevenue)}</Text></View>
            </View>
          ))}
        </View>

        {/* Expense breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <View style={styles.headerRow}>
            <View style={styles.cMonth}><Text style={styles.ht}>Month</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Bills</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Payroll</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Other Trend</Text></View>
            <View style={styles.cNum}><Text style={styles.ht}>Total</Text></View>
          </View>
          {scenario.months.map((m) => (
            <View key={m.month} style={styles.row}>
              <View style={styles.cMonth}><Text style={styles.cell}>{m.label}</Text></View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.recurringBills)}</Text></View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.payroll)}</Text></View>
              <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.trendExpenses)}</Text></View>
              <View style={styles.cNum}><Text style={[styles.cell, styles.neg]}>{fmt(m.totalExpenses)}</Text></View>
            </View>
          ))}
        </View>

        {/* Historical actuals */}
        {historicalMonths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historical Actuals (Last 12 Months)</Text>
            <View style={styles.headerRow}>
              <View style={styles.cMonth}><Text style={styles.ht}>Month</Text></View>
              <View style={styles.cNum}><Text style={styles.ht}>Revenue</Text></View>
              <View style={styles.cNum}><Text style={styles.ht}>Expenses</Text></View>
              <View style={styles.cNum}><Text style={styles.ht}>Net</Text></View>
            </View>
            {historicalMonths.map((m) => (
              <View key={m.month} style={styles.row}>
                <View style={styles.cMonth}><Text style={styles.cell}>{m.label}</Text></View>
                <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.actualRevenue)}</Text></View>
                <View style={styles.cNum}><Text style={styles.cell}>{fmt(m.actualExpenses)}</Text></View>
                <View style={styles.cNum}>
                  <Text style={[styles.cell, m.netCash >= 0 ? styles.pos : styles.neg]}>
                    {m.netCash >= 0 ? "+" : ""}{fmt(m.netCash)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
