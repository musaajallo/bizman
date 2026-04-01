import { Card } from "@/components/ui/card";
import { BillStatusBadge } from "./bill-status-badge";
import { BillPaymentHistory } from "./bill-payment-history";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
}

interface BillDetail {
  id: string;
  billNumber: string;
  referenceNumber: string | null;
  title: string;
  description: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  status: string;
  notes: string | null;
  vendor: { id: string; name: string; email: string | null; phone: string | null };
  payments: Payment[];
  paymentTermsDays: number | null;
  discountPercent: number;
  discountDays: number | null;
  discountCaptured: boolean;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function getDiscountInfo(bill: BillDetail) {
  if (!bill.discountPercent || !bill.discountDays) return null;
  const issueDate = new Date(bill.issueDate);
  const deadline = new Date(issueDate.getTime() + bill.discountDays * 24 * 60 * 60 * 1000);
  deadline.setHours(23, 59, 59, 999);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const discountAmount = parseFloat(((bill.amountDue * bill.discountPercent) / 100).toFixed(2));
  const windowOpen = daysLeft >= 0 && !bill.discountCaptured;
  // Annualised cost: (d / (1 - d)) * (365 / (N - m))
  const netDays = bill.paymentTermsDays ?? 30;
  const d = bill.discountPercent / 100;
  const annualisedCost = netDays > bill.discountDays
    ? ((d / (1 - d)) * (365 / (netDays - bill.discountDays))) * 100
    : null;
  return { deadline, daysLeft, discountAmount, windowOpen, annualisedCost };
}

export function BillDetailCard({ bill }: { bill: BillDetail }) {
  const canDelete = !["paid", "void"].includes(bill.status);
  const discountInfo = getDiscountInfo(bill);

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-muted-foreground">{bill.billNumber}</p>
              <BillStatusBadge status={bill.status} />
            </div>
            <h3 className="text-lg font-bold mt-1">{bill.title}</h3>
            <p className="text-sm text-muted-foreground">{bill.vendor.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono">{fmt(bill.totalAmount, bill.currency)}</p>
            {bill.amountDue > 0 && (
              <p className="text-sm text-amber-400 font-mono mt-0.5">{fmt(bill.amountDue, bill.currency)} due</p>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <Field label="Issue Date">{fmtDate(bill.issueDate)}</Field>
          <Field label="Due Date">{fmtDate(bill.dueDate)}</Field>
          {bill.referenceNumber && <Field label="Vendor Ref #"><span className="font-mono">{bill.referenceNumber}</span></Field>}
          <Field label="Vendor">
            <p>{bill.vendor.name}</p>
            {bill.vendor.email && <p className="text-xs text-muted-foreground">{bill.vendor.email}</p>}
          </Field>
          {bill.paidAt && <Field label="Paid On">{fmtDate(bill.paidAt)}</Field>}
        </div>

        {bill.description && (
          <>
            <div className="border-t border-border" />
            <Field label="Description">
              <p className="text-muted-foreground whitespace-pre-wrap">{bill.description}</p>
            </Field>
          </>
        )}

        <div className="border-t border-border" />

        {/* Amounts */}
        <div className="space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{fmt(bill.subtotal, bill.currency)}</span>
          </div>
          {bill.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax {bill.taxRate > 0 ? `(${bill.taxRate}%)` : ""}</span>
              <span className="font-mono">{fmt(bill.taxAmount, bill.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
            <span>Total</span>
            <span className="font-mono">{fmt(bill.totalAmount, bill.currency)}</span>
          </div>
          {bill.amountPaid > 0 && (
            <div className="flex justify-between text-sm text-emerald-400">
              <span>Paid</span>
              <span className="font-mono">{fmt(bill.amountPaid, bill.currency)}</span>
            </div>
          )}
          {bill.amountDue > 0 && (
            <div className="flex justify-between text-sm text-amber-400 font-bold">
              <span>Amount Due</span>
              <span className="font-mono">{fmt(bill.amountDue, bill.currency)}</span>
            </div>
          )}
        </div>

        {discountInfo && (
          <>
            <div className="border-t border-border" />
            <div className={`rounded-md p-3 space-y-2 text-sm ${discountInfo.windowOpen ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/40"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${discountInfo.windowOpen ? "text-emerald-500" : "text-muted-foreground"}`}>
                Early Payment Discount
                {bill.discountCaptured && " — Captured"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Terms">
                  {bill.discountPercent}% if paid within {bill.discountDays}d
                  {bill.paymentTermsDays ? ` (Net ${bill.paymentTermsDays})` : ""}
                </Field>
                <Field label="Discount Amount">
                  <span className="font-mono">{fmt(discountInfo.discountAmount, bill.currency)}</span>
                </Field>
                <Field label="Deadline">
                  {fmtDate(discountInfo.deadline.toISOString())}
                  {!bill.discountCaptured && (
                    <span className={`ml-1 text-xs ${discountInfo.windowOpen ? "text-emerald-500" : "text-destructive"}`}>
                      ({discountInfo.windowOpen ? `${discountInfo.daysLeft}d left` : "expired"})
                    </span>
                  )}
                </Field>
                {discountInfo.annualisedCost !== null && (
                  <Field label="Cost of Missing">
                    <span className="font-mono text-amber-400">{discountInfo.annualisedCost.toFixed(1)}% p.a.</span>
                  </Field>
                )}
              </div>
            </div>
          </>
        )}

        {bill.notes && (
          <>
            <div className="border-t border-border" />
            <Field label="Notes"><p className="text-muted-foreground whitespace-pre-wrap">{bill.notes}</p></Field>
          </>
        )}
      </Card>

      <BillPaymentHistory payments={bill.payments} currency={bill.currency} canDelete={canDelete} />
    </div>
  );
}
