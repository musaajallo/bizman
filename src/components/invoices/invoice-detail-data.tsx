import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  referenceNumber: string | null;
  issueDate: Date | string;
  dueDate: Date | string;
  sentAt: Date | string | null;
  viewedAt: Date | string | null;
  paidDate: Date | string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  currency: string;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  discountPercent: number | null;
  discountAmount: number;
  rushFeePercent: number | null;
  rushFee: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  lineItems: LineItem[];
  project: { name: string } | null;
  createdBy: { name: string | null };
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function InvoiceDetailData({ invoice }: { invoice: InvoiceData }) {
  return (
    <div className="space-y-4">
      {/* Client */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{invoice.clientName}</p>
          {invoice.clientEmail && <p className="text-muted-foreground">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-muted-foreground">{invoice.clientPhone}</p>}
          {invoice.clientAddress && <p className="text-muted-foreground">{invoice.clientAddress}</p>}
          {invoice.project && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span>{invoice.project.name}</span>
              </div>
            </>
          )}
          {invoice.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-xs">{invoice.referenceNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued</span>
            <span>{fmtDate(invoice.issueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due</span>
            <span>{fmtDate(invoice.dueDate)}</span>
          </div>
          {invoice.sentAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sent</span>
              <span>{fmtDate(invoice.sentAt)}</span>
            </div>
          )}
          {invoice.viewedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Viewed</span>
              <span>{fmtDate(invoice.viewedAt)}</span>
            </div>
          )}
          {invoice.paidDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-emerald-400">{fmtDate(invoice.paidDate)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Created by</span>
            <span>{invoice.createdBy.name ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No line items</p>
          ) : (
            <div className="space-y-3">
              {invoice.lineItems.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit ?? "units"} × {fmt(item.unitPrice, invoice.currency)}
                      </p>
                    </div>
                    <span className="font-mono text-sm shrink-0">{fmt(item.amount, invoice.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amounts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Amounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{fmt(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.rushFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Rush Fee{invoice.rushFeePercent ? ` (${invoice.rushFeePercent}%)` : ""}
              </span>
              <span className="font-mono text-amber-400">+{fmt(invoice.rushFee, invoice.currency)}</span>
            </div>
          )}
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Discount{invoice.discountPercent ? ` (${invoice.discountPercent}%)` : ""}
              </span>
              <span className="font-mono text-emerald-400">−{fmt(invoice.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxRate != null && invoice.taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
              <span className="font-mono">{fmt(invoice.taxAmount, invoice.currency)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="font-mono">{fmt(invoice.total, invoice.currency)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Paid</span>
              <span className="font-mono">{fmt(invoice.amountPaid, invoice.currency)}</span>
            </div>
          )}
          {invoice.amountDue > 0 && (
            <div className="flex justify-between font-bold text-base">
              <span>Amount Due</span>
              <span className="font-mono">{fmt(invoice.amountDue, invoice.currency)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
