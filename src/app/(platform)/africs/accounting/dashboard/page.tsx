import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  TrendingUp,
  ArrowRight,
  Receipt,
  Wallet,
  CreditCard,
} from "lucide-react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceDashboard, getRecurringInvoices } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import { RevenueChart } from "@/components/invoices/revenue-chart";
import { AgingReport } from "@/components/invoices/aging-report";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { ProcessRecurringButton } from "@/components/invoices/process-recurring-button";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

const INTERVAL_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default async function AccountingDashboardPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [invoiceDashboard, recurring] = await Promise.all([
    getInvoiceDashboard(owner.id),
    getRecurringInvoices(owner.id),
  ]);

  return (
    <div>
      <TopBar
        title="Accounting & Finance"
        subtitle="Financial overview across all modules"
      />
      <div className="p-6 space-y-10">

        {/* ============================================================
            SECTION: Invoicing
            ============================================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Invoicing</h2>
                <p className="text-xs text-muted-foreground">Revenue, outstanding, and aging</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/africs/accounting/invoices">
                <Button size="sm" variant="outline" className="gap-2 text-xs">
                  All Invoices
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/africs/accounting/invoices/new">
                <Button size="sm" className="text-xs">New Invoice</Button>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Outstanding</p>
                    <p className="text-base font-semibold font-mono">{formatCurrency(invoiceDashboard.outstanding)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Overdue ({invoiceDashboard.overdueCount})</p>
                    <p className="text-base font-semibold font-mono">{formatCurrency(invoiceDashboard.overdue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Paid This Month</p>
                    <p className="text-base font-semibold font-mono">{formatCurrency(invoiceDashboard.paidThisMonth)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Paid This Year</p>
                    <p className="text-base font-semibold font-mono">{formatCurrency(invoiceDashboard.paidThisYear)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Revenue (Last 12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={invoiceDashboard.monthlyRevenue} currency="USD" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aging Report</CardTitle>
              </CardHeader>
              <CardContent>
                <AgingReport buckets={invoiceDashboard.agingBuckets} currency="USD" />
              </CardContent>
            </Card>
          </div>

          {/* Detail Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(invoiceDashboard.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <InvoiceStatusBadge status={status} />
                      <span className="text-sm font-mono">{count}</span>
                    </div>
                  ))}
                  {Object.keys(invoiceDashboard.statusCounts).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceDashboard.topClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {invoiceDashboard.topClients.map((client, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.count} invoice{client.count !== 1 ? "s" : ""}</p>
                        </div>
                        <span className="font-mono text-sm">{formatCurrency(client.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Recurring Invoices</CardTitle>
                  <ProcessRecurringButton tenantId={owner.id} />
                </div>
              </CardHeader>
              <CardContent>
                {recurring.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recurring invoices set up</p>
                ) : (
                  <div className="space-y-3">
                    {recurring.map((inv) => (
                      <Link key={inv.id} href={`/africs/accounting/invoices/${inv.id}`} className="flex items-center justify-between group">
                        <div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.clientName} &middot; {INTERVAL_LABELS[inv.recurringInterval || "monthly"] || inv.recurringInterval}
                          </p>
                          {inv.nextRecurringDate && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              Next: {new Date(inv.nextRecurringDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{formatCurrency(inv.total)}</span>
                          <span className="text-xs text-muted-foreground">({inv._count.recurringChildren})</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Quick Stats */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground pt-3">
            <span>Total Invoices: <strong className="text-foreground">{invoiceDashboard.totalCount}</strong></span>
            <span>Total Invoiced: <strong className="text-foreground">{formatCurrency(invoiceDashboard.totalInvoiced)}</strong></span>
            <span>Drafts: <strong className="text-foreground">{invoiceDashboard.draftCount}</strong></span>
            <span>Recurring: <strong className="text-foreground">{recurring.length}</strong></span>
          </div>
        </section>

        {/* ============================================================
            SECTION: Expenses (placeholder for future)
            ============================================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Expenses</h2>
                <p className="text-xs text-muted-foreground">Spending and cost tracking</p>
              </div>
            </div>
            <Link href="/africs/accounting/expenses">
              <Button size="sm" variant="outline" className="gap-2 text-xs">
                View Expenses
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Expense tracking dashboard coming soon.</p>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION: Payroll (placeholder for future)
            ============================================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Payroll</h2>
                <p className="text-xs text-muted-foreground">Salary and compensation overview</p>
              </div>
            </div>
            <Link href="/africs/accounting/payroll">
              <Button size="sm" variant="outline" className="gap-2 text-xs">
                View Payroll
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Payroll dashboard coming soon.</p>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION: Payments (placeholder for future)
            ============================================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Payments</h2>
                <p className="text-xs text-muted-foreground">Received payments summary</p>
              </div>
            </div>
            <Link href="/africs/accounting/payments">
              <Button size="sm" variant="outline" className="gap-2 text-xs">
                View Payments
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Payments dashboard coming soon.</p>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
