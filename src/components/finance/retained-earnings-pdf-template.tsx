import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RetainedEarningsStatement } from "@/lib/actions/accounting/statements";

const C = {
  primary: "#4F6EF7",
  dark:    "#111827",
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
  periodLine:   { fontSize: 8, color: C.muted },
  divider:      { borderBottomWidth: 1.5, borderBottomColor: C.primary, marginTop: 10, marginBottom: 20 },
  table:        { marginBottom: 16 },
  headerRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4, marginBottom: 2 },
  headerLabel:  { flex: 1, fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  headerAmt:    { width: 100, textAlign: "right", fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  row:          { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
  indentRow:    { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border, paddingLeft: 16 },
  rowLabel:     { flex: 1 },
  rowAmt:       { width: 100, textAlign: "right" },
  totalRow:     { flexDirection: "row", backgroundColor: "#e0e7ff", borderRadius: 4, paddingVertical: 7, paddingHorizontal: 8, marginTop: 4 },
  totalLabel:   { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 10 },
  totalAmt:     { width: 100, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 10 },
  note:         { marginTop: 24, padding: 12, backgroundColor: C.light, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  noteText:     { fontSize: 8, color: C.muted, lineHeight: 1.6 },
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText:   { fontSize: 7, color: C.muted },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props { data: RetainedEarningsStatement; companyName: string }

export function RetainedEarningsPdfTemplate({ data, companyName }: Props) {
  const hasPrior = !!data.prior;

  const rows: { label: string; current: number; prior?: number; indent?: boolean; bold?: boolean }[] = [
    { label: "Opening Retained Earnings",      current: data.openingRE,  prior: data.prior?.openingRE },
    { label: "Net Income for Period",           current: data.netIncome,  prior: data.prior?.netIncome,  indent: true },
    { label: "Less: Drawings / Distributions", current: -data.drawings,  prior: data.prior ? -data.prior.drawings : undefined, indent: true },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.company}>{companyName}</Text>
          <Text style={s.docTitle}>Statement of Retained Earnings</Text>
          <Text style={s.periodLine}>
            For the period {fmtDate(data.period.startDate)} – {fmtDate(data.period.endDate)}
          </Text>
        </View>
        <View style={s.divider} />

        {/* Table */}
        <View style={s.table}>
          {hasPrior && (
            <View style={s.headerRow}>
              <Text style={s.headerLabel}>Description</Text>
              <Text style={s.headerAmt}>Prior Period</Text>
              <Text style={[s.headerAmt, { fontFamily: "Helvetica-Bold" }]}>Current Period</Text>
            </View>
          )}

          {rows.map((r) => (
            <View key={r.label} style={r.indent ? s.indentRow : s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              {hasPrior && (
                <Text style={[s.rowAmt, { color: C.muted }]}>
                  {r.prior !== undefined ? fmt(r.prior) : "—"}
                </Text>
              )}
              <Text style={[s.rowAmt, { color: r.current < 0 ? C.red : C.dark }]}>
                {fmt(r.current)}
              </Text>
            </View>
          ))}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Closing Retained Earnings</Text>
            {hasPrior && (
              <Text style={[s.totalAmt, { color: C.muted }]}>
                {data.prior ? fmt(data.prior.closingRE) : "—"}
              </Text>
            )}
            <Text style={[s.totalAmt, { color: data.closingRE < 0 ? C.red : C.primary }]}>
              {fmt(data.closingRE)}
            </Text>
          </View>
        </View>

        {/* Note */}
        <View style={s.note}>
          <Text style={s.noteText}>
            Closing Retained Earnings represents accumulated profits less distributions since inception.
            This balance is carried forward to the Balance Sheet under Equity.
          </Text>
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
