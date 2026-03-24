import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string | null;
}

interface InvoiceData {
  invoiceNumber: string;
  referenceNumber: string | null;
  issueDate: Date | string;
  dueDate: Date | string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  currency: string;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  lineItems: LineItem[];
  status: string;
  type?: string;
}

interface Props {
  invoice: InvoiceData;
  invoiceType?: string;
  ownerName: string;
  ownerColor?: string;
  logoUrl?: string | null;
  bankDetails?: {
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankRoutingNumber?: string | null;
    bankSwift?: string | null;
    bankIban?: string | null;
  } | null;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#4F6EF7",
  },
  headerLeft: {},
  headerRight: {
    textAlign: "right",
  },
  ownerName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#4F6EF7",
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  label: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  infoBlock: {
    width: "48%",
  },
  infoBlockRight: {
    width: "48%",
    textAlign: "right",
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  infoText: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colUnitPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  tableHeaderText: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  tableCellText: {
    fontSize: 9,
  },
  tableCellMono: {
    fontSize: 9,
    fontFamily: "Courier",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 25,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalRowBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 9,
    fontFamily: "Courier",
  },
  totalBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  dueAmount: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
  },
  notesSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
  },
  notesTitle: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  bankSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  bankTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bankLabel: {
    fontSize: 8,
    color: "#6b7280",
    width: 100,
  },
  bankValue: {
    fontSize: 9,
    fontFamily: "Courier",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  paidStamp: {
    position: "absolute",
    top: 200,
    right: 60,
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    opacity: 0.15,
    transform: "rotate(-30deg)",
  },
  voidStamp: {
    position: "absolute",
    top: 200,
    right: 80,
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: "#ef4444",
    opacity: 0.15,
    transform: "rotate(-30deg)",
  },
});

export function InvoicePdfTemplate({ invoice, invoiceType, ownerName, ownerColor, logoUrl, bankDetails }: Props) {
  const accentColor = ownerColor || "#4F6EF7";
  const type = invoiceType || invoice.type || "standard";
  const isProforma = type === "proforma";
  const isCreditNote = type === "credit_note";
  const documentLabel = isProforma ? "PROFORMA INVOICE" : isCreditNote ? "CREDIT NOTE" : "INVOICE";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Paid/Void/Proforma watermark */}
        {invoice.status === "paid" && <Text style={styles.paidStamp}>PAID</Text>}
        {invoice.status === "void" && <Text style={styles.voidStamp}>VOID</Text>}
        {isProforma && invoice.status !== "void" && <Text style={styles.voidStamp}>PROFORMA</Text>}
        {isCreditNote && invoice.status !== "void" && <Text style={styles.voidStamp}>CREDIT NOTE</Text>}

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: accentColor }]}>
          <View style={styles.headerLeft}>
            {logoUrl ? (
              <Image src={logoUrl} style={{ height: 65, maxWidth: 180, objectFit: "contain" }} />
            ) : (
              <Text style={[styles.ownerName, { color: accentColor }]}>{ownerName}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.invoiceNumber, { fontSize: 22, marginBottom: 2 }]}>{documentLabel}</Text>
            <Text style={[styles.invoiceNumber, { fontSize: 14, color: "#6b7280" }]}>{invoice.invoiceNumber}</Text>
            {invoice.referenceNumber && (
              <Text style={styles.infoText}>Ref: {invoice.referenceNumber}</Text>
            )}
          </View>
        </View>

        {/* Bill To + Dates */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.clientName}>{invoice.clientName}</Text>
            {invoice.clientEmail && <Text style={styles.infoText}>{invoice.clientEmail}</Text>}
            {invoice.clientPhone && <Text style={styles.infoText}>{invoice.clientPhone}</Text>}
            {invoice.clientAddress && <Text style={styles.infoText}>{invoice.clientAddress}</Text>}
          </View>
          <View style={styles.infoBlockRight}>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.infoText}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.infoText}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCellMono, styles.colQty]}>
                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              </Text>
              <Text style={[styles.tableCellMono, styles.colUnitPrice]}>
                {formatCurrency(item.unitPrice, invoice.currency)}
              </Text>
              <Text style={[styles.tableCellMono, styles.colAmount]}>
                {formatCurrency(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
            </View>
            {invoice.taxRate != null && invoice.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount, invoice.currency)}</Text>
              </View>
            )}
            {invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>-{formatCurrency(invoice.discountAmount, invoice.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRowBorder}>
              <Text style={styles.totalBold}>Total</Text>
              <Text style={styles.totalBold}>{formatCurrency(invoice.total, invoice.currency)}</Text>
            </View>
            {invoice.amountPaid > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Paid</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(invoice.amountPaid, invoice.currency)}</Text>
                </View>
                <View style={styles.totalRowBorder}>
                  <Text style={styles.totalBold}>Balance Due</Text>
                  <Text style={invoice.amountDue > 0 ? styles.dueAmount : styles.totalBold}>
                    {formatCurrency(invoice.amountDue, invoice.currency)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bank Details */}
        {bankDetails && (bankDetails.bankName || bankDetails.bankAccountNumber) && (
          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>Payment Details</Text>
            {bankDetails.bankName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank</Text>
                <Text style={styles.bankValue}>{bankDetails.bankName}</Text>
              </View>
            )}
            {bankDetails.bankAccountName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Name</Text>
                <Text style={styles.bankValue}>{bankDetails.bankAccountName}</Text>
              </View>
            )}
            {bankDetails.bankAccountNumber && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account No.</Text>
                <Text style={styles.bankValue}>{bankDetails.bankAccountNumber}</Text>
              </View>
            )}
            {bankDetails.bankRoutingNumber && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Routing No.</Text>
                <Text style={styles.bankValue}>{bankDetails.bankRoutingNumber}</Text>
              </View>
            )}
            {bankDetails.bankSwift && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>SWIFT/BIC</Text>
                <Text style={styles.bankValue}>{bankDetails.bankSwift}</Text>
              </View>
            )}
            {bankDetails.bankIban && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>IBAN</Text>
                <Text style={styles.bankValue}>{bankDetails.bankIban}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notesSection}>
            {invoice.notes && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.notesTitle}>Notes</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.notesTitle}>Terms & Conditions</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {invoice.invoiceNumber} • Generated by AfricsCore
        </Text>
      </Page>
    </Document>
  );
}
