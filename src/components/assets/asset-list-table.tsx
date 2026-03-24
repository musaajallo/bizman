import Link from "next/link";
import { AssetStatusBadge } from "./asset-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { ASSET_CATEGORIES } from "@/lib/asset-constants";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  location: string | null;
  currentValue: number;
  currency: string;
  currentAssignment: {
    employee: { id: string; firstName: string; lastName: string } | null;
    location: string | null;
  } | null;
}

export function AssetListTable({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return (
      <div className="border rounded-lg p-10 text-center">
        <p className="text-sm text-muted-foreground">No assets yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Number</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Value</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            const assignedTo = a.currentAssignment
              ? a.currentAssignment.employee
                ? `${a.currentAssignment.employee.firstName} ${a.currentAssignment.employee.lastName}`
                : a.currentAssignment.location
              : null;

            const catLabel = ASSET_CATEGORIES[a.category as keyof typeof ASSET_CATEGORIES]?.label ?? a.category;

            return (
              <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{a.assetNumber}</td>
                <td className="px-3 py-2.5">
                  <p className="font-medium">{a.name}</p>
                  {a.location && !a.currentAssignment && (
                    <p className="text-xs text-muted-foreground">{a.location}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-sm text-muted-foreground">{catLabel}</td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-sm text-muted-foreground">
                  {assignedTo ?? <span className="text-xs">Unassigned</span>}
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-sm">
                  {a.currency} {a.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5">
                  <AssetStatusBadge status={a.status} />
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/africs/accounting/assets/${a.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
