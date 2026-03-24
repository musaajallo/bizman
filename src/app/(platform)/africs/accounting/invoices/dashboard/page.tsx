import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceDashboard } from "@/lib/actions/invoices";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/invoices/revenue-chart";
import { AgingReport } from "@/components/invoices/aging-report";
import { notFound } from "next/navigation";
import { TrendingUp, AlertCircle, CheckCircle2, FileText } from "lucide-react";

function formatCurrency(amount: number, currency = "USD") {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function InvoiceDashboardPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const data = await getInvoiceDashboard(owner.id);
  const currency = "USD";

  const stats = [
    {
      label: "Outstanding",
      value: formatCurrency(data.outstanding, currency),
      sub: `${data.overdueCount} overdue`,
      icon: TrendingUp,
      highlight: data.overdueCount > 0 ? "text-amber-400" : "text-primary",
    },
    {
      label: "Overdue",
      value: formatCurrency(data.overdue, currency),
      sub: "past due date",
      icon: AlertCircle,
      highlight: data.overdue > 0 ? "text-destructive" : "text-muted-foreground",
    },
    {
      label: "Paid This Month",
      value: formatCurrency(data.paidThisMonth, currency),
      sub: `${formatCurrency(data.paidThisYear, currency)} this year`,
      icon: CheckCircle2,
      highlight: "text-emerald-400",
    },
    {
      label: "Total Invoiced",
      value: formatCurrency(data.totalInvoiced, currency),
      sub: `${data.totalCount} invoices · ${data.draftCount} drafts`,
      icon: FileText,
      highlight: "text-primary",
    },
  ];

  return (
    <div>
      <TopBar
        title="Invoice Dashboard"
        subtitle="Revenue overview and accounts receivable"
      />
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className={`h-4 w-4 ${s.highlight}`} />
                </div>
                <p className={`text-2xl font-semibold font-mono ${s.highlight}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue chart — spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue — Last 12 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={data.monthlyRevenue} currency={currency} />
            </CardContent>
          </Card>

          {/* Aging report */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Accounts Receivable Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <AgingReport buckets={data.agingBuckets} currency={currency} />
            </CardContent>
          </Card>
        </div>

        {/* Top clients */}
        {data.topClients.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topClients.map((client, i) => {
                  const maxTotal = data.topClients[0].total;
                  const pct = maxTotal > 0 ? (client.total / maxTotal) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[60%]">{client.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatCurrency(client.total, currency)} · {client.count} inv.
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
