"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MaintenanceStatusBadge } from "./asset-status-badge";
import { deleteMaintenance } from "@/lib/actions/assets";
import { Trash2 } from "lucide-react";

interface MaintenanceRecord {
  id: string;
  title: string;
  description: string | null;
  maintenanceDate: string;
  nextMaintenanceDate: string | null;
  cost: number | null;
  currency: string;
  performedBy: string | null;
  status: string;
}

interface Props {
  assetId: string;
  records: MaintenanceRecord[];
}

export function AssetMaintenanceTable({ assetId, records }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMaintenance(id, assetId);
      router.refresh();
    });
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No maintenance records.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th className="text-left py-2">Title</th>
          <th className="text-left py-2 hidden md:table-cell">Date</th>
          <th className="text-left py-2 hidden lg:table-cell">Next Due</th>
          <th className="text-left py-2 hidden md:table-cell">Cost</th>
          <th className="text-left py-2">Status</th>
          <th className="py-2 w-8" />
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id} className="border-b border-border/50 last:border-0">
            <td className="py-2.5">
              <p className="font-medium">{r.title}</p>
              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              {r.performedBy && <p className="text-xs text-muted-foreground">By: {r.performedBy}</p>}
            </td>
            <td className="py-2.5 hidden md:table-cell text-xs text-muted-foreground">{fmt(r.maintenanceDate)}</td>
            <td className="py-2.5 hidden lg:table-cell text-xs text-muted-foreground">
              {r.nextMaintenanceDate ? fmt(r.nextMaintenanceDate) : "—"}
            </td>
            <td className="py-2.5 hidden md:table-cell text-xs">
              {r.cost != null ? `${r.currency} ${r.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
            </td>
            <td className="py-2.5"><MaintenanceStatusBadge status={r.status} /></td>
            <td className="py-2.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(r.id)}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
