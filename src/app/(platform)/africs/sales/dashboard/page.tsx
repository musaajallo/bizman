import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShoppingCart,
  Store,
  UtensilsCrossed,
  RefreshCcw,
  KeyRound,
  ArrowRight,
} from "lucide-react";

const sections = [
  { title: "Sales Orders", subtitle: "Orders, quotes, and pipeline", icon: ShoppingCart, href: "/africs/sales/orders" },
  { title: "POS Shop", subtitle: "Retail point-of-sale transactions", icon: Store, href: "/africs/sales/pos-shop" },
  { title: "POS Restaurant", subtitle: "Restaurant ordering and billing", icon: UtensilsCrossed, href: "/africs/sales/pos-restaurant" },
  { title: "Subscriptions", subtitle: "Recurring revenue and renewals", icon: RefreshCcw, href: "/africs/sales/subscriptions" },
  { title: "Rental", subtitle: "Equipment and asset rentals", icon: KeyRound, href: "/africs/sales/rental" },
];

export default function SalesDashboardPage() {
  return (
    <div>
      <TopBar
        title="Sales"
        subtitle="Sales performance across all channels"
      />
      <div className="p-6 space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{s.title}</h2>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>
              <Link href={s.href}>
                <Button size="sm" variant="outline" className="gap-2 text-xs">
                  View {s.title}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {s.title} dashboard coming soon.
                </p>
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
