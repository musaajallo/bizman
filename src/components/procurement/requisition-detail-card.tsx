import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequisitionStatusBadge, PriorityBadge } from "./procurement-status-badge";
import { Separator } from "@/components/ui/separator";

interface RequisitionItem {
  id: string;
  description: string;
  quantity: number;
  unit: string | null;
  estimatedUnitPrice: number;
}

interface Requisition {
  id: string;
  requisitionNumber: string;
  title: string;
  description: string | null;
  department: string | null;
  priority: string;
  status: string;
  requiredByDate: string | null;
  notes: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedBy: { name: string | null; email: string };
  reviewedBy: { name: string | null; email: string } | null;
  items: RequisitionItem[];
}

export function RequisitionDetailCard({ requisition }: { requisition: Requisition }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const estimatedTotal = requisition.items.reduce(
    (sum, i) => sum + i.quantity * (i.estimatedUnitPrice ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground mb-1">{requisition.requisitionNumber}</p>
              <CardTitle className="text-xl">{requisition.title}</CardTitle>
              {requisition.description && <p className="text-sm text-muted-foreground mt-1">{requisition.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <RequisitionStatusBadge status={requisition.status} />
              <PriorityBadge priority={requisition.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Requested By</dt>
              <dd className="font-medium mt-0.5">{requisition.requestedBy.name ?? requisition.requestedBy.email}</dd>
            </div>
            {requisition.department && (
              <div>
                <dt className="text-xs text-muted-foreground">Department</dt>
                <dd className="font-medium mt-0.5">{requisition.department}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="font-medium mt-0.5">{fmt(requisition.createdAt)}</dd>
            </div>
            {requisition.requiredByDate && (
              <div>
                <dt className="text-xs text-muted-foreground">Required By</dt>
                <dd className="font-medium mt-0.5">{fmt(requisition.requiredByDate)}</dd>
              </div>
            )}
          </dl>

          {(requisition.reviewedBy || requisition.reviewNote) && (
            <>
              <Separator className="my-4" />
              <div className="text-sm space-y-1">
                <p className="text-xs text-muted-foreground">Review</p>
                {requisition.reviewedBy && (
                  <p><span className="text-muted-foreground">By:</span> {requisition.reviewedBy.name ?? requisition.reviewedBy.email}</p>
                )}
                {requisition.reviewNote && <p className="italic text-muted-foreground">&ldquo;{requisition.reviewNote}&rdquo;</p>}
              </div>
            </>
          )}

          {requisition.notes && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p>{requisition.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 pr-4">Qty</th>
                <th className="text-left py-2">Unit</th>
                <th className="text-right py-2">Est. Cost</th>
                <th className="text-right py-2">Est. Total</th>
              </tr>
            </thead>
            <tbody>
              {requisition.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5">
                    <p>{item.description}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-muted-foreground">{item.unit ?? "—"}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {item.estimatedUnitPrice != null ? item.estimatedUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {item.estimatedUnitPrice != null
                      ? (item.quantity * item.estimatedUnitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {estimatedTotal > 0 && (
            <div className="flex justify-end mt-3 pt-3 border-t text-sm font-semibold gap-8">
              <span>Estimated Total</span>
              <span className="tabular-nums">{estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
