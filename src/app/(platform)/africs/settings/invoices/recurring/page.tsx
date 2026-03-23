import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getRecurringInvoices } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { ProcessRecurringButton } from "@/components/invoices/process-recurring-button";
import { ArrowRight, Clock } from "lucide-react";

const INTERVAL_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default async function RecurringSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const recurring = await getRecurringInvoices(owner.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Invoice — Recurring</h2>
        <ProcessRecurringButton tenantId={owner.id} />
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Manage invoices that auto-generate on a schedule. Enable recurring on any invoice from its detail page.
      </p>

      {recurring.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No recurring invoices set up yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Open any invoice and enable &quot;Recurring&quot; in the sidebar to create a recurring template.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {recurring.map((inv) => (
            <Link
              key={inv.id}
              href={`/africs/accounting/invoices/${inv.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                  <InvoiceStatusBadge status={inv.status} />
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {INTERVAL_LABELS[inv.recurringInterval || "monthly"]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{inv.clientName}</p>
                {inv.nextRecurringDate && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Next: {new Date(inv.nextRecurringDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-mono">{formatCurrency(inv.total)}</p>
                  <p className="text-[10px] text-muted-foreground">{inv._count.recurringChildren} generated</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
