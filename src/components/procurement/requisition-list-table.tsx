import Link from "next/link";
import { RequisitionStatusBadge, PriorityBadge } from "./procurement-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Requisition {
  id: string;
  requisitionNumber: string;
  title: string;
  priority: string;
  status: string;
  department: string | null;
  requiredByDate: string | null;
  createdAt: string;
  requestedBy: { name: string | null; email: string };
  _count: { items: number; purchaseOrders: number };
}

export function RequisitionListTable({ requisitions }: { requisitions: Requisition[] }) {
  if (requisitions.length === 0) {
    return (
      <div className="border rounded-lg p-10 text-center">
        <p className="text-sm text-muted-foreground">No requisitions yet</p>
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
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Requested By</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Priority</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Required By</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {requisitions.map((r) => (
            <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{r.requisitionNumber}</td>
              <td className="px-3 py-2.5">
                <p className="font-medium">{r.title}</p>
                {r.department && <p className="text-xs text-muted-foreground">{r.department}</p>}
              </td>
              <td className="px-3 py-2.5 hidden md:table-cell text-sm text-muted-foreground">
                {r.requestedBy.name ?? r.requestedBy.email}
              </td>
              <td className="px-3 py-2.5 hidden lg:table-cell">
                <PriorityBadge priority={r.priority} />
              </td>
              <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground">
                {r.requiredByDate ? new Date(r.requiredByDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </td>
              <td className="px-3 py-2.5">
                <RequisitionStatusBadge status={r.status} />
              </td>
              <td className="px-3 py-2.5">
                <Link href={`/africs/accounting/procurement/requisitions/${r.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}>
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
