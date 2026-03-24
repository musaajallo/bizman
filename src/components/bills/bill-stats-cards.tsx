import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle, Building2 } from "lucide-react";

interface Stats {
  outstandingCount: number;
  outstandingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonthAmount: number;
  activeVendors: number;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function BillStatsCards({ stats, currency = "GMD" }: { stats: Stats; currency?: string }) {
  const cards = [
    { label: "Outstanding",       value: fmt(stats.outstandingAmount, currency), sub: `${stats.outstandingCount} bills`,    icon: Clock,        color: "text-amber-400" },
    { label: "Overdue",           value: fmt(stats.overdueAmount, currency),     sub: `${stats.overdueCount} bills`,        icon: AlertCircle,  color: "text-red-400" },
    { label: "Paid This Month",   value: fmt(stats.paidThisMonthAmount, currency), sub: "total paid",                        icon: CheckCircle,  color: "text-emerald-400" },
    { label: "Active Vendors",    value: String(stats.activeVendors),            sub: "vendors",                            icon: Building2,    color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className={`text-xl font-bold font-mono ${c.color}`}>{c.value}</p>
          <p className="text-xs text-muted-foreground">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}
