"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { returnAsset } from "@/lib/actions/assets";
import { RotateCcw } from "lucide-react";

interface Assignment {
  id: string;
  assignedDate: string;
  returnedDate: string | null;
  location: string | null;
  notes: string | null;
  employee: { id: string; firstName: string; lastName: string; jobTitle: string | null } | null;
  assignedBy: { name: string | null } | null;
}

interface Props {
  assetId: string;
  assignments: Assignment[];
}

export function AssetAssignmentTable({ assetId, assignments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleReturn(assignmentId: string) {
    startTransition(async () => {
      await returnAsset(assignmentId, assetId);
      router.refresh();
    });
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No assignment history.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th className="text-left py-2">Assigned To</th>
          <th className="text-left py-2 hidden md:table-cell">Location</th>
          <th className="text-left py-2">From</th>
          <th className="text-left py-2">Until</th>
          <th className="text-left py-2 hidden md:table-cell">By</th>
          <th className="py-2 w-8" />
        </tr>
      </thead>
      <tbody>
        {assignments.map((a) => (
          <tr key={a.id} className="border-b border-border/50 last:border-0">
            <td className="py-2.5">
              {a.employee ? (
                <div>
                  <p className="font-medium">{a.employee.firstName} {a.employee.lastName}</p>
                  {a.employee.jobTitle && <p className="text-xs text-muted-foreground">{a.employee.jobTitle}</p>}
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </td>
            <td className="py-2.5 hidden md:table-cell text-muted-foreground text-xs">{a.location ?? "—"}</td>
            <td className="py-2.5 text-muted-foreground text-xs">{fmt(a.assignedDate)}</td>
            <td className="py-2.5">
              {a.returnedDate ? (
                <span className="text-xs text-muted-foreground">{fmt(a.returnedDate)}</span>
              ) : (
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">Active</Badge>
              )}
            </td>
            <td className="py-2.5 hidden md:table-cell text-xs text-muted-foreground">
              {a.assignedBy?.name ?? "—"}
            </td>
            <td className="py-2.5">
              {!a.returnedDate && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleReturn(a.id)}
                  disabled={isPending}
                  title="Return asset"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
