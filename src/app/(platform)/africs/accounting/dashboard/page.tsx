"use server";

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
  Users,
  ShoppingCart,
  Package,
  FileText,
  Banknote,
} from "lucide-react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceDashboard, getRecurringInvoices } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import { RevenueChart } from "@/components/invoices/revenue-chart";
import { AgingReport } from "@/components/invoices/aging-report";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { ProcessRecurringButton } from "@/components/invoices/process-recurring-button";
import { getExpenseStats } from "@/lib/actions/expenses";
import { getBillStats } from "@/lib/actions/bills";
import { getPayrollStats } from "@/lib/actions/payroll";
import { getProcurementStats } from "@/lib/actions/procurement";
import { getAssetStats } from "@/lib/actions/assets";

function formatCurrency(amount: number, currency = "GMD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

const INTERVAL_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function SectionHeader({
  icon,
  iconColor,
  title,
  subtitle,
  href,
  linkLabel,
  extraActions,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        <Link href={href}>
          <Button size="sm" variant="outline" className="gap-2 text-xs">
            {linkLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-base font-semibold font-mono">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AccountingDashboardPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [invoiceDashboard, recurring, expenseStats, billStats, payrollStats, procurementStats, assetStats] =
    await Promise.all([
      getInvoiceDashboard(owner.id),
      getRecurringInvoices(owner.id),
      getExpenseStats(),
      getBillStats(),
      getPayrollStats(),
      getProcurementStats(),
      getAssetStats(),
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
          <SectionHeader
            icon={<FileSpreadsheet className="h-4 w-4 text-primary" />}
            iconColor="bg-primary/10"
            title="Invoicing"
            subtitle="Revenue, outstanding, and aging"
            href="/africs/accounting/invoices"
            linkLabel="All Invoices"
            extraActions={
              <Link href="/africs/accounting/invoices/new">
                <Button size="sm" className="text-xs">New Invoice</Button>
              </Link>
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              color="bg-amber-500/10"
              icon={<DollarSign className="h-4 w-4 text-amber-500" />}
              label="Outstanding"
              value={formatCurrency(invoiceDashboard.outstanding)}
            />
            <StatCard
              color="bg-red-500/10"
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              label={`Overdue (${invoiceDashboard.overdueCount})`}
              value={formatCurrency(invoiceDashboard.overdue)}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Paid This Month"
              value={formatCurrency(invoiceDashboard.paidThisMonth)}
            />
            <StatCard
              color="bg-primary/10"
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Paid This Year"
              value={formatCurrency(invoiceDashboard.paidThisYear)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Revenue (Last 12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={invoiceDashboard.monthlyRevenue} currency="GMD" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aging Report</CardTitle>
              </CardHeader>
              <CardContent>
                <AgingReport buckets={invoiceDashboard.agingBuckets} currency="GMD" />
              </CardContent>
            </Card>
          </div>

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

          <div className="flex items-center gap-6 text-xs text-muted-foreground pt-3">
            <span>Total Invoices: <strong className="text-foreground">{invoiceDashboard.totalCount}</strong></span>
            <span>Total Invoiced: <strong className="text-foreground">{formatCurrency(invoiceDashboard.totalInvoiced)}</strong></span>
            <span>Drafts: <strong className="text-foreground">{invoiceDashboard.draftCount}</strong></span>
            <span>Recurring: <strong className="text-foreground">{recurring.length}</strong></span>
          </div>
        </section>

        {/* ============================================================
            SECTION: Bills / Payables
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<FileText className="h-4 w-4 text-blue-500" />}
            iconColor="bg-blue-500/10"
            title="Bills & Payables"
            subtitle="Vendor bills and outstanding payables"
            href="/africs/accounting/bills"
            linkLabel="All Bills"
            extraActions={
              <Link href="/africs/accounting/bills/new">
                <Button size="sm" className="text-xs">New Bill</Button>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-amber-500/10"
              icon={<DollarSign className="h-4 w-4 text-amber-500" />}
              label={`Outstanding (${billStats.outstandingCount})`}
              value={formatCurrency(billStats.outstandingAmount)}
            />
            <StatCard
              color="bg-red-500/10"
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              label={`Overdue (${billStats.overdueCount})`}
              value={formatCurrency(billStats.overdueAmount)}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Paid This Month"
              value={formatCurrency(billStats.paidThisMonthAmount)}
            />
            <StatCard
              color="bg-muted"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              label="Active Vendors"
              value={String(billStats.activeVendors)}
            />
          </div>
        </section>

        {/* ============================================================
            SECTION: Expenses
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<Receipt className="h-4 w-4 text-orange-500" />}
            iconColor="bg-orange-500/10"
            title="Expenses"
            subtitle="Employee expense claims and reimbursements"
            href="/africs/accounting/expenses"
            linkLabel="View Expenses"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-amber-500/10"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label={`Pending (${expenseStats.pendingCount})`}
              value={formatCurrency(expenseStats.pendingAmount)}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label={`Approved (${expenseStats.approvedCount})`}
              value={formatCurrency(expenseStats.approvedAmount)}
            />
            <StatCard
              color="bg-blue-500/10"
              icon={<Banknote className="h-4 w-4 text-blue-500" />}
              label={`Reimbursed (${expenseStats.reimbursedCount})`}
              value={formatCurrency(expenseStats.reimbursedAmount)}
            />
            <StatCard
              color="bg-muted"
              icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
              label="Total Claims"
              value={String(expenseStats.totalCount)}
            />
          </div>
        </section>

        {/* ============================================================
            SECTION: Payroll
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<Wallet className="h-4 w-4 text-violet-500" />}
            iconColor="bg-violet-500/10"
            title="Payroll"
            subtitle="Salary runs and compensation overview"
            href="/africs/accounting/payroll"
            linkLabel="View Payroll"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              color="bg-violet-500/10"
              icon={<TrendingUp className="h-4 w-4 text-violet-500" />}
              label="Total Paid (All Time)"
              value={formatCurrency(payrollStats.totalPaid)}
            />
            <StatCard
              color="bg-muted"
              icon={<FileSpreadsheet className="h-4 w-4 text-muted-foreground" />}
              label="Total Payroll Runs"
              value={String(payrollStats.totalRuns)}
            />
            {payrollStats.latestRun ? (
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-[11px] text-muted-foreground mb-1">Latest Run</p>
                  <Link href={`/africs/accounting/payroll/${payrollStats.latestRun.id}`} className="hover:text-primary transition-colors">
                    <p className="text-sm font-semibold">{payrollStats.latestRun.periodLabel}</p>
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{payrollStats.latestRun.employeeCount} employees</span>
                    <span className="text-sm font-mono font-medium">{formatCurrency(payrollStats.latestRun.totalNet, payrollStats.latestRun.currency)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{payrollStats.latestRun.status}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <p className="text-sm text-muted-foreground">No payroll runs yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* ============================================================
            SECTION: Procurement
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<ShoppingCart className="h-4 w-4 text-teal-500" />}
            iconColor="bg-teal-500/10"
            title="Procurement"
            subtitle="Purchase requisitions and orders"
            href="/africs/accounting/procurement"
            linkLabel="View Procurement"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-amber-500/10"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="Pending Approvals"
              value={String(procurementStats.pendingReqs)}
            />
            <StatCard
              color="bg-blue-500/10"
              icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}
              label="Open Purchase Orders"
              value={String(procurementStats.openPos)}
            />
            <StatCard
              color="bg-orange-500/10"
              icon={<Package className="h-4 w-4 text-orange-500" />}
              label="Awaiting Receipt"
              value={String(procurementStats.awaitingReceipt)}
            />
            <StatCard
              color="bg-teal-500/10"
              icon={<TrendingUp className="h-4 w-4 text-teal-500" />}
              label="Total PO Value"
              value={formatCurrency(procurementStats.totalPoValue)}
            />
          </div>
        </section>

        {/* ============================================================
            SECTION: Assets
            ============================================================ */}
        <section>
          <SectionHeader
            icon={<Package className="h-4 w-4 text-indigo-500" />}
            iconColor="bg-indigo-500/10"
            title="Assets"
            subtitle="Fixed asset register and current value"
            href="/africs/accounting/assets"
            linkLabel="View Assets"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              color="bg-indigo-500/10"
              icon={<Package className="h-4 w-4 text-indigo-500" />}
              label="Total Assets"
              value={String(assetStats.total)}
            />
            <StatCard
              color="bg-emerald-500/10"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Active"
              value={String(assetStats.active)}
            />
            <StatCard
              color="bg-amber-500/10"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="In Maintenance"
              value={String(assetStats.inMaintenance)}
            />
            <StatCard
              color="bg-primary/10"
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Total Book Value"
              value={formatCurrency(assetStats.totalValue)}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
