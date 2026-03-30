import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CashFlowStatement } from "@/lib/actions/accounting/statements";

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
  divider:      { borderBottomWidth: 1.5, borderBottomColor: C.primary, marginTop: 10, marginBottom: 16 },
  summaryStrip: { flexDirection: "row", gap: 8, marginBottom: 20 },
  summaryBox:   { flex: 1, backgroundColor: C.light, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: C.border },
  summaryLabel: { fontSize: 7, color: C.muted, marginBottom: 3 },
  summaryVal:   { fontSize: 11, fontFamily: "Helvetica-Bold" },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  row:          { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4 },
  rowLabel:     { flex: 1 },
  rowAmt:       { width: 80, textAlign: "right" },
  subtotalRow:  { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#374151", paddingVertical: 5, marginTop: 1 },
  subtotalLabel:{ flex: 1, fontFamily: "Helvetica-Bold" },
  subtotalAmt:  { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold" },
  summarySection: { marginTop: 8, borderTopWidth: 1.5, borderTopColor: C.primary, paddingTop: 10 },
  summRow:      { flexDirection: "row", paddingVertical: 3 },
  summLabel:    { flex: 1, color: C.muted },
  summAmt:      { width: 80, textAlign: "right" },
  netRow:       { flexDirection: "row", paddingVertical: 4 },
  netLabel:     { flex: 1, fontFamily: "Helvetica-Bold" },
  netAmt:       { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold" },
  closingRow:   { flexDirection: "row", backgroundColor: "#e0e7ff", borderRadius: 4, paddingVertical: 7, paddingHorizontal: 8, marginTop: 4 },
  closingLabel: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 10 },
  closingAmt:   { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 10 },
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText:   { fontSize: 7, color: C.muted },
});

function fmt(n: number) {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtAbs(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props { data: CashFlowStatement; companyName: string }

export function CashFlowPdfTemplate({ data, companyName }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.company}>{companyName}</Text>
          <Text style={s.docTitle}>Cash Flow Statement</Text>
          <Text style={s.periodLine}>
            For the period {fmtDate(data.period.startDate)} – {fmtDate(data.period.endDate)}
            {"  "}(Indirect Method)
          </Text>
        </View>
        <View style={s.divider} />

        {/* Summary strip */}
        <View style={s.summaryStrip}>
          {[
            { label: "Operating", val: data.netOperating },
            { label: "Investing", val: data.netInvesting },
            { label: "Financing", val: data.netFinancing },
            { label: "Net Change", val: data.netCashChange },
          ].map((item) => (
            <View key={item.label} style={s.summaryBox}>
              <Text style={s.summaryLabel}>{item.label}</Text>
              <Text style={[s.summaryVal, { color: item.val >= 0 ? C.green : C.red }]}>
                {fmt(item.val)}
              </Text>
            </View>
          ))}
        </View>

        {/* Operating */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Operating Activities</Text>
          <CFRow label="Net Income" val={data.netIncome} />
          <CFRow label="Depreciation (add-back)" val={data.depreciation} />
          <CFRow label="Change in Accounts Receivable" val={data.changeInAR} />
          <CFRow label="Change in Inventory" val={data.changeInInventory} />
          <CFRow label="Change in Accounts Payable" val={data.changeInAP} />
          <CFRow label="Change in Wages Payable" val={data.changeInWagesPayable} />
          <View style={s.subtotalRow}>
            <Text style={s.subtotalLabel}>Net Cash from Operating</Text>
            <Text style={[s.subtotalAmt, { color: data.netOperating < 0 ? C.red : C.dark }]}>{fmt(data.netOperating)}</Text>
          </View>
        </View>

        {/* Investing */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Investing Activities</Text>
          <CFRow label="PP&amp;E Purchases / Disposals" val={data.ppePurchases} />
          <View style={s.subtotalRow}>
            <Text style={s.subtotalLabel}>Net Cash from Investing</Text>
            <Text style={[s.subtotalAmt, { color: data.netInvesting < 0 ? C.red : C.dark }]}>{fmt(data.netInvesting)}</Text>
          </View>
        </View>

        {/* Financing */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Financing Activities</Text>
          <CFRow label="Loan Proceeds" val={data.loanProceeds} />
          <CFRow label="Loan Repayments" val={data.loanRepayments} />
          <CFRow label="Owner Drawings" val={data.drawings} />
          <CFRow label="Capital Contributions" val={data.capitalContributions} />
          <View style={s.subtotalRow}>
            <Text style={s.subtotalLabel}>Net Cash from Financing</Text>
            <Text style={[s.subtotalAmt, { color: data.netFinancing < 0 ? C.red : C.dark }]}>{fmt(data.netFinancing)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={s.summarySection}>
          <View style={s.summRow}>
            <Text style={s.summLabel}>Opening Cash Balance</Text>
            <Text style={s.summAmt}>{fmtAbs(data.openingCash)}</Text>
          </View>
          <View style={s.netRow}>
            <Text style={s.netLabel}>Net Change in Cash</Text>
            <Text style={[s.netAmt, { color: data.netCashChange < 0 ? C.red : C.green }]}>{fmt(data.netCashChange)}</Text>
          </View>
          <View style={s.closingRow}>
            <Text style={s.closingLabel}>Closing Cash Balance</Text>
            <Text style={[s.closingAmt, { color: data.closingCash < 0 ? C.red : C.primary }]}>{fmtAbs(data.closingCash)}</Text>
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

function CFRow({ label, val }: { label: string; val: number }) {
  if (val === 0) return null;
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowAmt, { color: val < 0 ? C.red : C.green }]}>{fmt(val)}</Text>
    </View>
  );
}
