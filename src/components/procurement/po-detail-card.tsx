import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PoStatusBadge } from "./procurement-status-badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface PoItem {
  id: string;
  description: string;
  quantity: number;
  quantityReceived: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  description: string | null;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  expectedDelivery: string | null;
  receivedDate: string | null;
  notes: string | null;
  vendor: { id: string; name: string };
  createdBy: { name: string | null; email: string };
  items: PoItem[];
  bill: { id: string; billNumber: string } | null;
  requisition: { id: string; requisitionNumber: string; title: string } | null;
}

export function PoDetailCard({ order }: { order: PurchaseOrder }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground mb-1">{order.poNumber}</p>
              <CardTitle className="text-xl">{order.title}</CardTitle>
              {order.description && <p className="text-sm text-muted-foreground mt-1">{order.description}</p>}
            </div>
            <PoStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Vendor</dt>
              <dd className="font-medium mt-0.5">{order.vendor.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Issued</dt>
              <dd className="font-medium mt-0.5">{fmt(order.issueDate)}</dd>
            </div>
            {order.expectedDelivery && (
              <div>
                <dt className="text-xs text-muted-foreground">Expected Delivery</dt>
                <dd className="font-medium mt-0.5">{fmt(order.expectedDelivery)}</dd>
              </div>
            )}
            {order.receivedDate && (
              <div>
                <dt className="text-xs text-muted-foreground">Received</dt>
                <dd className="font-medium mt-0.5">{fmt(order.receivedDate)}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">Created By</dt>
              <dd className="font-medium mt-0.5">{order.createdBy.name ?? order.createdBy.email}</dd>
            </div>
            {order.requisition && (
              <div>
                <dt className="text-xs text-muted-foreground">From Requisition</dt>
                <dd className="mt-0.5">
                  <Link href={`/africs/accounting/procurement/requisitions/${order.requisition.id}`} className="text-primary hover:underline font-mono text-xs">
                    {order.requisition.requisitionNumber}
                  </Link>
                </dd>
              </div>
            )}
            {order.bill && (
              <div>
                <dt className="text-xs text-muted-foreground">Bill</dt>
                <dd className="mt-0.5">
                  <Link href={`/africs/accounting/bills/${order.bill.id}`} className="text-primary hover:underline font-mono text-xs">
                    {order.bill.billNumber}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
          {order.notes && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground mb-1">Notes for Vendor</p>
                <p>{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 pr-4">Ordered</th>
                <th className="text-right py-2 pr-4">Received</th>
                <th className="text-left py-2">Unit</th>
                <th className="text-right py-2">Unit Cost</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5">
                    <p>{item.description}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{item.quantityReceived}</td>
                  <td className="py-2.5 text-muted-foreground">{item.unit ?? "—"}</td>
                  <td className="py-2.5 text-right tabular-nums">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1 pt-3 mt-2 border-t text-sm">
            <div className="flex gap-8">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{order.currency} {order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-8">
              <span className="text-muted-foreground">Tax ({order.taxRate}%)</span>
              <span className="tabular-nums">{order.currency} {order.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-8 font-semibold text-base border-t border-border pt-2 mt-1">
              <span>Total</span>
              <span className="tabular-nums">{order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
