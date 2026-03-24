import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface Props {
  payslip: {
    employeeName: string;
    employeeNumber: string;
    jobTitle: string | null;
    department: string | null;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowance: number;
    otherAllowanceLabel: string | null;
    grossPay: number;
    pensionRate: number;
    pensionContribution: number;
    medicalAidDeduction: number;
    payeTax: number;
    otherDeduction: number;
    otherDeductionLabel: string | null;
    totalDeductions: number;
    netPay: number;
    currency: string;
    status: string;
    notes: string | null;
  };
  periodLabel: string;
  payrollRunId: string;
  ownerName: string;
  ownerAddress?: string | null;
  ownerColor?: string | null;
  logoUrl?: string | null;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: "#1a1a1a", paddingTop: 40, paddingBottom: 60, paddingHorizontal: 48, backgroundColor: "#ffffff" },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: "#4F6EF7" },
  logo: { height: 44, maxWidth: 160, objectFit: "contain" },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#4F6EF7" },
  headerRight: { alignItems: "flex-end" },
  payslipLabel: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#1a1a1a" },
  periodLabel: { fontSize: 11, color: "#666", marginTop: 4 },
  runRef: { fontSize: 7, color: "#999", marginTop: 3, fontFamily: "Courier" },
  // Employee block
  employeeBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  infoGroup: { gap: 3 },
  infoLabel: { fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  infoName: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  infoSub: { fontSize: 8, color: "#555" },
  infoMono: { fontSize: 8, fontFamily: "Courier", color: "#777" },
  // Tables
  tableHeader: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f0f0f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 3, marginBottom: 2 },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#444", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#e8e8e8" },
  tableTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 7, borderTopWidth: 1.5, borderTopColor: "#1a1a1a", marginTop: 2 },
  tableLabel: { fontSize: 9, color: "#333" },
  tableValue: { fontSize: 9, fontFamily: "Courier", color: "#333" },
  tableLabelBold: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  tableValueBold: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#444", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, marginTop: 18 },
  // Net pay box
  netPayBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f0fdf4", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 6, marginTop: 18, borderWidth: 1, borderColor: "#bbf7d0" },
  netPayLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#166534", textTransform: "uppercase", letterSpacing: 1 },
  netPayAmount: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  // Notes
  notesBox: { marginTop: 16, padding: 10, backgroundColor: "#fafafa", borderRadius: 4, borderWidth: 0.5, borderColor: "#e0e0e0" },
  notesLabel: { fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  notesText: { fontSize: 8, color: "#555", lineHeight: 1.4 },
  // Footer
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, borderTopWidth: 0.5, borderTopColor: "#e0e0e0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#aaa" },
});

export function PayslipPdf({ payslip, periodLabel, payrollRunId, ownerName, ownerAddress, ownerColor, logoUrl }: Props) {
  const accentColor = ownerColor || "#4F6EF7";
  const currency = payslip.currency;

  const earningsRows = [
    { label: "Basic Salary", value: payslip.basicSalary },
    ...(payslip.housingAllowance > 0 ? [{ label: "Housing Allowance", value: payslip.housingAllowance }] : []),
    ...(payslip.transportAllowance > 0 ? [{ label: "Transport Allowance", value: payslip.transportAllowance }] : []),
    ...(payslip.otherAllowance > 0 ? [{ label: payslip.otherAllowanceLabel || "Other Allowance", value: payslip.otherAllowance }] : []),
  ];

  const deductionRows = [
    ...(payslip.pensionContribution > 0 ? [{ label: `Pension Contribution (${payslip.pensionRate}%)`, value: payslip.pensionContribution }] : []),
    ...(payslip.medicalAidDeduction > 0 ? [{ label: "Medical Aid", value: payslip.medicalAidDeduction }] : []),
    ...(payslip.payeTax > 0 ? [{ label: "PAYE Tax", value: payslip.payeTax }] : []),
    ...(payslip.otherDeduction > 0 ? [{ label: payslip.otherDeductionLabel || "Other Deduction", value: payslip.otherDeduction }] : []),
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: accentColor }]}>
          <View>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : (
              <Text style={[styles.companyName, { color: accentColor }]}>{ownerName}</Text>
            )}
            {ownerAddress && <Text style={{ fontSize: 7, color: "#888", marginTop: 4 }}>{ownerAddress}</Text>}
          </View>
          <View style={styles.headerRight}>
            {logoUrl && <Image src={logoUrl} style={[styles.logo, { marginBottom: 6 }]} />}
            <Text style={styles.payslipLabel}>PAYSLIP</Text>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <Text style={styles.runRef}>Run #{payrollRunId.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Employee + Pay Info */}
        <View style={styles.employeeBlock}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Employee</Text>
            <Text style={styles.infoName}>{payslip.employeeName}</Text>
            <Text style={styles.infoMono}>{payslip.employeeNumber}</Text>
            {payslip.jobTitle && <Text style={styles.infoSub}>{payslip.jobTitle}</Text>}
            {payslip.department && <Text style={styles.infoSub}>{payslip.department}</Text>}
          </View>
          <View style={[styles.infoGroup, { alignItems: "flex-end" }]}>
            <Text style={styles.infoLabel}>Pay Period</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{periodLabel}</Text>
            {(payslip.bankName || payslip.bankAccountNumber) && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 10 }]}>Payment</Text>
                {payslip.bankName && <Text style={styles.infoSub}>{payslip.bankName}</Text>}
                {payslip.bankAccountName && <Text style={styles.infoSub}>{payslip.bankAccountName}</Text>}
                {payslip.bankAccountNumber && <Text style={styles.infoMono}>{payslip.bankAccountNumber}</Text>}
              </>
            )}
          </View>
        </View>

        {/* Earnings */}
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Description</Text>
          <Text style={styles.tableHeaderText}>Amount</Text>
        </View>
        {earningsRows.map((row, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableLabel}>{row.label}</Text>
            <Text style={styles.tableValue}>{fmt(row.value, currency)}</Text>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={styles.tableLabelBold}>Gross Pay</Text>
          <Text style={styles.tableValueBold}>{fmt(payslip.grossPay, currency)}</Text>
        </View>

        {/* Deductions */}
        {deductionRows.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Description</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
            {deductionRows.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <Text style={[styles.tableValue, { color: "#dc2626" }]}>{fmt(row.value, currency)}</Text>
              </View>
            ))}
            <View style={styles.tableTotalRow}>
              <Text style={styles.tableLabelBold}>Total Deductions</Text>
              <Text style={[styles.tableValueBold, { color: "#dc2626" }]}>{fmt(payslip.totalDeductions, currency)}</Text>
            </View>
          </>
        )}

        {/* Net Pay */}
        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayAmount}>{fmt(payslip.netPay, currency)}</Text>
        </View>

        {/* Notes */}
        {payslip.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{payslip.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{ownerName} · Payslip · {periodLabel}</Text>
          <Text style={styles.footerText}>
            {payslip.employeeNumber} · Generated {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
