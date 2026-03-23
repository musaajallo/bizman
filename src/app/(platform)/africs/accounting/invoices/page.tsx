import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoices } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceTypeBadge } from "@/components/invoices/invoice-type-badge";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const params = await searchParams;
  const invoices = await getInvoices(owner.id, { status: params.status, type: params.type });

  const typeTabs = [
    { label: "All", value: undefined },
    { label: "Invoices", value: "standard" },
    { label: "Proformas", value: "proforma" },
  ];

  const statusTabs = [
    { label: "All", value: undefined },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Overdue", value: "overdue" },
    { label: "Paid", value: "paid" },
    { label: "Accepted", value: "accepted" },
    { label: "Converted", value: "converted" },
  ];

  // Build URL preserving the other filter
  function buildUrl(newType?: string, newStatus?: string) {
    const p = new URLSearchParams();
    const t = newType !== undefined ? newType : params.type;
    const s = newStatus !== undefined ? newStatus : params.status;
    if (t) p.set("type", t);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/africs/accounting/invoices${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <TopBar
        title="Invoices"
        subtitle="Create and manage client invoices"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/invoices/settings">
              <Button size="sm" variant="outline" className="gap-2">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Button>
            </Link>
            <Link href="/africs/accounting/invoices/new/proforma">
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Proforma
              </Button>
            </Link>
            <Link href="/africs/accounting/invoices/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Invoice
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {/* Type Tabs */}
        <div className="flex gap-1">
          {typeTabs.map((tab) => (
            <Link key={tab.label} href={buildUrl(tab.value ?? "", params.status)}>
              <Button
                variant={params.type === tab.value || (!params.type && !tab.value) ? "default" : "ghost"}
                size="sm"
                className="text-xs"
              >
                {tab.label}
              </Button>
            </Link>
          ))}
          <div className="w-px bg-border mx-2" />
          {statusTabs.map((tab) => (
            <Link key={tab.label} href={buildUrl(params.type, tab.value ?? "")}>
              <Button
                variant={params.status === tab.value || (!params.status && !tab.value) ? "secondary" : "ghost"}
                size="sm"
                className="text-xs"
              >
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No invoices yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create your first invoice to start billing clients.
              </p>
              <div className="flex gap-2 mt-4">
                <Link href="/africs/accounting/invoices/new/proforma">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    New Proforma
                  </Button>
                </Link>
                <Link href="/africs/accounting/invoices/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    New Invoice
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Issue Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Due Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="relative border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                      <td className="py-3 px-4 font-mono font-medium">
                        <Link href={`/africs/accounting/invoices/${inv.id}`} className="absolute inset-0" aria-label={`View invoice ${inv.invoiceNumber}`} />
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceTypeBadge type={inv.type} />
                      </td>
                      <td className="py-3 px-4">{inv.clientName}</td>
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
