import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { getTenantBySlug } from "@/lib/actions/tenants";
import { getInvoicesForClient } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ClientInvoicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const invoices = await getInvoicesForClient(tenant.id);

  return (
    <div>
      <TopBar title="Invoices" subtitle={`Invoices for ${tenant.name}`} />
      <div className="p-6">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No invoices</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No invoices have been created for this client yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Issue Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Due Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{inv.project?.name || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(inv.total, inv.currency)}</td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={inv.status} />
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
