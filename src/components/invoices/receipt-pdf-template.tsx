import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  date: Date | string;
}

interface Props {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  currency: string;
  amountPaid: number;
  paidDate: Date | string | null;
  payments: Payment[];
  projectName?: string | null;
  ownerName: string;
  ownerColor?: string;
  logoUrl?: string | null;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function rcpNum(invoiceNumber: string) {
  return `RCP-${invoiceNumber.replace(/^[A-Z]+-/, "")}`;
}

function methodLabel(method: string | null) {
  if (!method) return "—";
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    height: 48,
    maxWidth: 120,
    objectFit: "contain",
  },
  ownerName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  receiptLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 22,
    color: "rgba(255,255,255,0.8)",
  },
  // Body
  body: {
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  block: {},
  blockRight: {
    textAlign: "right",
  },
  fieldLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  // Client box
  clientBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  clientName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  clientSub: {
    fontSize: 9,
    color: "#6b7280",
  },
  // Amount box
  amountBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: "Courier-Bold",
    color: "#111827",
  },
  // Payments breakdown
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 12,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  methodBadge: {
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: "#374151",
    backgroundColor: "#f3f4f6",
  },
  paymentRef: {
    fontSize: 9,
    color: "#9ca3af",
    marginLeft: 6,
  },
  paymentAmount: {
    fontSize: 10,
    fontFamily: "Courier-Bold",
    color: "#374151",
  },
  // Paid stamp
  stamp: {
    position: "absolute",
    top: 180,
    right: 50,
    fontSize: 44,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    opacity: 0.12,
    transform: "rotate(-30deg)",
  },
  // Invoice ref row
  invoiceRef: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  refLabel: {
    fontSize: 9,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  refValue: {
    fontSize: 10,
    fontFamily: "Courier-Bold",
    color: "#374151",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#d1d5db",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderStyle: "dashed",
    paddingTop: 10,
  },
  // Perforation line
  perforation: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderStyle: "dashed",
    marginHorizontal: 40,
    marginVertical: 4,
  },
});

export function ReceiptPdfTemplate({
  invoiceNumber,
  clientName,
  clientEmail,
  currency,
  amountPaid,
  paidDate,
  payments,
  projectName,
  ownerName,
  ownerColor,
  logoUrl,
}: Props) {
  const color = ownerColor || "#4F6EF7";
  const rcp = rcpNum(invoiceNumber);
  const dateLabel = paidDate
    ? fmtDate(paidDate)
    : payments[0]?.date
    ? fmtDate(payments[0].date)
    : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PAID watermark */}
        <Text style={styles.stamp}>PAID</Text>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: color }]}>
          <View style={styles.headerLeft}>
            {logoUrl ? (
              <>
                <Image src={logoUrl} style={styles.logo} />
                <Text style={styles.receiptLabel}>Payment Receipt</Text>
              </>
            ) : (
              <View>
                <Text style={styles.ownerName}>{ownerName}</Text>
                <Text style={styles.receiptLabel}>Payment Receipt</Text>
              </View>
            )}
          </View>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Perforation */}
        <View style={styles.perforation} />

        {/* Body */}
        <View style={styles.body}>
          {/* Receipt # and Date */}
          <View style={styles.row}>
            <View style={styles.block}>
              <Text style={styles.fieldLabel}>Receipt No.</Text>
              <Text style={styles.fieldValue}>{rcp}</Text>
            </View>
            <View style={styles.blockRight}>
              <Text style={styles.fieldLabel}>Date Paid</Text>
              <Text style={styles.fieldValue}>{dateLabel}</Text>
            </View>
          </View>

          {/* Client */}
          <View style={styles.clientBox}>
            <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Received From</Text>
            <Text style={styles.clientName}>{clientName}</Text>
            {clientEmail && <Text style={styles.clientSub}>{clientEmail}</Text>}
          </View>

          {/* Invoice reference */}
          <View style={styles.invoiceRef}>
            <Text style={styles.refLabel}>For Invoice</Text>
            <View style={{ textAlign: "right" }}>
              <Text style={styles.refValue}>{invoiceNumber}</Text>
              {projectName && <Text style={[styles.clientSub, { textAlign: "right" }]}>{projectName}</Text>}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Amount Paid</Text>
            <Text style={styles.amountValue}>{fmt(amountPaid, currency)}</Text>
          </View>

          {/* Payment breakdown */}
          {payments.length > 0 && (
            <View>
              <View style={styles.divider} />
              {payments.map((p, i) => (
                <View key={i} style={styles.paymentRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.methodBadge}>{methodLabel(p.method)}</Text>
                    {p.reference && <Text style={styles.paymentRef}>#{p.reference}</Text>}
                  </View>
                  <Text style={styles.paymentAmount}>{fmt(p.amount, currency)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {rcp} &bull; {ownerName} &bull; Thank you for your payment!
        </Text>
      </Page>
    </Document>
  );
}
