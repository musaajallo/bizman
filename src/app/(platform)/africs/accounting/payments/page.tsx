import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getAllPayments } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  check: "Check",
  card: "Card",
  mobile_money: "Mobile Money",
  other: "Other",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function PaymentsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const payments = await getAllPayments(owner.id);

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <TopBar title="Payments" subtitle="All recorded payments across invoices" />
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold font-mono mt-1">
                {payments.length > 0 ? formatCurrency(totalReceived, payments[0].invoice.currency) : "$0.00"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold mt-1">{payments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold font-mono mt-1">
                {(() => {
                  const now = new Date();
                  const thisMonth = payments.filter((p) => {
                    const d = new Date(p.date);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  });
                  const total = thisMonth.reduce((sum, p) => sum + p.amount, 0);
                  return payments.length > 0 ? formatCurrency(total, payments[0].invoice.currency) : "$0.00";
                })()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No payments yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Payments will appear here once recorded against invoices.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Reference</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(p.date)}</td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/africs/accounting/invoices/${p.invoice.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {p.invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{p.invoice.clientName}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {p.method ? methodLabels[p.method] || p.method : "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {p.reference || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400">
                        {formatCurrency(p.amount, p.invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {p.recordedBy.name ?? "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
