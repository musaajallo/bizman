import { InvoiceSummary } from "./invoice-summary";
import { InvoiceStatusBadge } from "./invoice-status-badge";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string | null;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
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
  project?: { name: string } | null;
}

interface Props {
  invoice: InvoiceData;
  invoiceType?: string;
  ownerName?: string;
  accentColor?: string | null;
  logoUrl?: string | null;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function InvoicePreview({ invoice, invoiceType, ownerName, accentColor, logoUrl }: Props) {
  const isProforma = invoiceType === "proforma";
  const documentLabel = isProforma ? "Proforma Invoice" : "Invoice";
  const color = accentColor || "#4F6EF7";

  return (
    <div className="bg-background border rounded-lg p-8 space-y-8">
      {/* Header */}
      <div
        className="flex justify-between items-start pb-5 border-b-2"
        style={{ borderColor: color }}
      >
        {/* Left: logo or company name */}
        <div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="object-contain" style={{ height: "5.4rem" }} />
          ) : (
            <h2 className="text-2xl font-bold" style={{ color }}>{ownerName || documentLabel}</h2>
          )}
          {invoice.project && (
            <p className="text-sm text-muted-foreground mt-1">Project: {invoice.project.name}</p>
          )}
        </div>

        {/* Right: document label + invoice number + status */}
        <div className="text-right shrink-0 ml-6">
          <p className="text-2xl font-bold mb-0.5">{documentLabel}</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-base font-mono text-muted-foreground">{invoice.invoiceNumber}</span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          {invoice.referenceNumber && (
            <p className="text-xs text-muted-foreground mt-1">Ref: {invoice.referenceNumber}</p>
          )}
        </div>
      </div>

      {/* Dates & Client */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bill To</p>
          <p className="font-medium">{invoice.clientName}</p>
          {invoice.clientEmail && <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-sm text-muted-foreground">{invoice.clientPhone}</p>}
          {invoice.clientAddress && <p className="text-sm text-muted-foreground">{invoice.clientAddress}</p>}
        </div>
        <div className="text-right space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Issue Date</p>
            <p className="text-sm font-medium">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-right py-2 text-xs font-medium text-muted-foreground w-20">Qty</th>
              <th className="text-right py-2 text-xs font-medium text-muted-foreground w-28">Unit Price</th>
              <th className="text-right py-2 text-xs font-medium text-muted-foreground w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right font-mono">
                  {item.quantity}
                  {item.unit && <span className="text-muted-foreground ml-1">{item.unit}</span>}
                </td>
                <td className="py-3 text-right font-mono">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="py-3 text-right font-mono">{formatCurrency(item.amount, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <InvoiceSummary
            subtotal={invoice.subtotal}
            taxRate={invoice.taxRate}
            taxAmount={invoice.taxAmount}
            discountAmount={invoice.discountAmount}
            total={invoice.total}
            amountPaid={invoice.amountPaid}
            amountDue={invoice.amountDue}
            currency={invoice.currency}
          />
        </div>
      </div>

      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="border-t pt-6 space-y-4 text-sm">
          {invoice.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Terms & Conditions</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
