import { Card, CardContent } from "@/components/ui/card";
import { Package, Activity, Wrench, Banknote } from "lucide-react";

interface Props {
  stats: { total: number; active: number; inMaintenance: number; totalValue: number };
  currency?: string;
}

export function AssetStatsCards({ stats, currency = "GMD" }: Props) {
  const cards = [
    { label: "Total Assets",    value: stats.total,        icon: Package,  color: "text-blue-400" },
    { label: "Active",          value: stats.active,       icon: Activity, color: "text-emerald-400" },
    { label: "In Maintenance",  value: stats.inMaintenance, icon: Wrench,  color: "text-amber-400" },
    {
      label: "Total Value",
      value: `${currency} ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Banknote,
      color: "text-purple-400",
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
