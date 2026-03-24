import { Card } from "@/components/ui/card";
import { Receipt, Clock, CheckCircle, Banknote } from "lucide-react";

interface Stats {
  totalCount: number;
  totalAmount: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  reimbursedCount: number;
  reimbursedAmount: number;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function ExpenseStatsCards({ stats, currency }: { stats: Stats; currency: string }) {
  const cards = [
    {
      label: "Total Expenses",
      count: stats.totalCount,
      amount: stats.totalAmount,
      icon: Receipt,
      color: "text-muted-foreground",
    },
    {
      label: "Pending Review",
      count: stats.pendingCount,
      amount: stats.pendingAmount,
      icon: Clock,
      color: "text-amber-400",
    },
    {
      label: "Approved",
      count: stats.approvedCount,
      amount: stats.approvedAmount,
      icon: CheckCircle,
      color: "text-blue-400",
    },
    {
      label: "Reimbursed",
      count: stats.reimbursedCount,
      amount: stats.reimbursedAmount,
      icon: Banknote,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className={`text-xl font-bold font-mono ${c.color}`}>{fmt(c.amount, currency)}</p>
          <p className="text-xs text-muted-foreground">{c.count} {c.count === 1 ? "expense" : "expenses"}</p>
        </Card>
      ))}
    </div>
  );
}
