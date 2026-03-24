import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileMinus } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getCreditNotes } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CreditNotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const params = await searchParams;
  const creditNotes = await getCreditNotes(owner.id, { status: params.status });

  const statusTabs = [
    { label: "All", value: undefined },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Applied", value: "applied" },
    { label: "Void", value: "void" },
  ];

  function buildUrl(newStatus?: string) {
    const p = new URLSearchParams();
    if (newStatus) p.set("status", newStatus);
    const qs = p.toString();
    return `/africs/accounting/credit-notes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <TopBar
        title="Credit Notes"
        subtitle="Issue credits against invoices"
        actions={
          <Link href="/africs/accounting/credit-notes/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              New Credit Note
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        {/* Status Tabs */}
        <div className="flex gap-1">
          {statusTabs.map((tab) => (
            <Link key={tab.label} href={buildUrl(tab.value)}>
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

        {creditNotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <FileMinus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No credit notes</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Issue a credit note to reduce what a client owes on an existing invoice.
              </p>
              <Link href="/africs/accounting/credit-notes/new" className="mt-4">
                <Button size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  New Credit Note
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">CN #</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Ref Invoice</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Issue Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.map((cn) => (
                    <tr key={cn.id} className="relative border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                      <td className="py-3 px-4 font-mono font-medium">
                        <Link href={`/africs/accounting/credit-notes/${cn.id}`} className="absolute inset-0" aria-label={`View credit note ${cn.invoiceNumber}`} />
                        {cn.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">{cn.clientName}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {cn.creditNoteFor ? (
                          <Link href={`/africs/accounting/invoices/${cn.creditNoteFor.id}`} className="hover:underline relative z-10">
                            {cn.creditNoteFor.invoiceNumber}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(cn.issueDate)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(cn.total, cn.currency)}</td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={cn.status} />
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
