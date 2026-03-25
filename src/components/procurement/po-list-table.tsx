import Link from "next/link";
import { PoStatusBadge } from "./procurement-status-badge";
import { ExternalLink } from "lucide-react";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  status: string;
  currency: string;
  totalAmount: number;
  issueDate: string;
  expectedDelivery: string | null;
  vendor: { name: string };
  _count: { items: number };
}

export function PoListTable({ orders }: { orders: PurchaseOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-10 text-center">
        <p className="text-sm text-muted-foreground">No purchase orders yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Number</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Title</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Vendor</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Amount</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Expected</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{o.poNumber}</td>
              <td className="px-3 py-2.5">
                <p className="font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o._count.items} item{o._count.items !== 1 ? "s" : ""}</p>
              </td>
              <td className="px-3 py-2.5 hidden md:table-cell text-sm text-muted-foreground">{o.vendor.name}</td>
              <td className="px-3 py-2.5 hidden lg:table-cell text-sm font-medium">
                {o.currency} {o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground">
                {o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </td>
              <td className="px-3 py-2.5">
                <PoStatusBadge status={o.status} />
              </td>
              <td className="px-3 py-2.5">
                <Link href={`/africs/accounting/procurement/orders/${o.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
