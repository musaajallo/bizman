import { Card } from "@/components/ui/card";
import { VendorStatusBadge } from "./vendor-status-badge";
import { PAYMENT_TERMS } from "@/lib/bill-constants";

interface VendorDetail {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  paymentTerms: string;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  notes: string | null;
  status: string;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GMD", maximumFractionDigits: 0 }).format(n);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function VendorDetailCard({ vendor }: { vendor: VendorDetail }) {
  const termLabel = PAYMENT_TERMS.find((t) => t.value === vendor.paymentTerms)?.label ?? vendor.paymentTerms;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: fmt(vendor.totalBilled), color: "text-foreground" },
          { label: "Total Paid", value: fmt(vendor.totalPaid), color: "text-emerald-400" },
          { label: "Outstanding", value: fmt(vendor.totalOutstanding), color: vendor.totalOutstanding > 0 ? "text-amber-400" : "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Details */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{vendor.name}</h3>
          <VendorStatusBadge status={vendor.status} />
        </div>
        <div className="border-t border-border" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {vendor.contactName && <Field label="Contact">{vendor.contactName}</Field>}
          {vendor.email && <Field label="Email"><a href={`mailto:${vendor.email}`} className="text-primary hover:underline">{vendor.email}</a></Field>}
          {vendor.phone && <Field label="Phone">{vendor.phone}</Field>}
          {vendor.website && <Field label="Website"><a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{vendor.website}</a></Field>}
          <Field label="Payment Terms">{termLabel}</Field>
          {vendor.address && <Field label="Address"><span className="whitespace-pre-wrap">{vendor.address}</span></Field>}
        </div>

        {(vendor.bankName || vendor.bankAccountNumber) && (
          <>
            <div className="border-t border-border" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {vendor.bankName && <Field label="Bank">{vendor.bankName}{vendor.bankBranch ? ` — ${vendor.bankBranch}` : ""}</Field>}
              {vendor.bankAccountName && <Field label="Account Name">{vendor.bankAccountName}</Field>}
              {vendor.bankAccountNumber && <Field label="Account Number"><span className="font-mono">{vendor.bankAccountNumber}</span></Field>}
            </div>
          </>
        )}

        {vendor.notes && (
          <>
            <div className="border-t border-border" />
            <Field label="Notes"><span className="text-muted-foreground whitespace-pre-wrap">{vendor.notes}</span></Field>
          </>
        )}
      </Card>
    </div>
  );
}
