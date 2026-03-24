import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ShoppingBasket, Truck, Banknote } from "lucide-react";

interface Props {
  stats: { openPos: number; pendingReqs: number; awaitingReceipt: number; totalPoValue: number };
  currency?: string;
}

export function ProcurementStatsCards({ stats, currency = "GMD" }: Props) {
  const cards = [
    { label: "Pending Approvals", value: stats.pendingReqs, icon: ClipboardList, color: "text-amber-400" },
    { label: "Open Orders", value: stats.openPos, icon: ShoppingBasket, color: "text-blue-400" },
    { label: "Awaiting Receipt", value: stats.awaitingReceipt, icon: Truck, color: "text-purple-400" },
    {
      label: "Total PO Value",
      value: `${currency} ${stats.totalPoValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Banknote,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{c.label}</p>
              <p className="text-lg font-semibold leading-tight">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
