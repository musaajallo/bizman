"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { activateAppraisalCycle, closeAppraisalCycle, deleteAppraisalCycle } from "@/lib/actions/appraisals";
import { ExternalLink, Pencil, Play, XCircle, Trash2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const APPRAISAL_STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  self_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  manager_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface Appraisal {
  id: string;
  status: string;
  selfRating: number | null;
  managerRating: number | null;
  finalRating: number | null;
  employee: { id: string; firstName: string; lastName: string; jobTitle: string | null; department: string | null };
}

interface Props {
  cycle: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
    _count: { appraisals: number };
    appraisals: Appraisal[];
  };
}

export function CycleDetailCard({ cycle }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(cycle.status);

  function handleActivate() {
    if (!confirm(`Activate "${cycle.name}"? This will create appraisal records for all active employees.`)) return;
    startTransition(async () => {
      await activateAppraisalCycle(cycle.id);
      setStatus("active");
    });
  }

  function handleClose() {
    if (!confirm(`Close "${cycle.name}"? No further updates will be accepted.`)) return;
    startTransition(async () => {
      await closeAppraisalCycle(cycle.id);
      setStatus("closed");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this cycle? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteAppraisalCycle(cycle.id);
      if (result?.error) { alert(result.error); return; }
      router.push("/africs/hr/appraisals");
    });
  }

  const completed = cycle.appraisals.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{cycle.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(cycle.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                {" – "}
                {new Date(cycle.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_STYLES[status] ?? ""}`}>
                {status}
              </span>
              {status === "draft" && (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleActivate} disabled={isPending}>
                    <Play className="h-3 w-3" />Activate
                  </Button>
                  <Link href={`/africs/hr/appraisals/cycles/${cycle.id}/edit`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {status === "active" && (
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-muted-foreground" onClick={handleClose} disabled={isPending}>
                  <XCircle className="h-3 w-3" />Close Cycle
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold font-mono">{cycle._count.appraisals}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-semibold font-mono text-emerald-400">{completed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-semibold font-mono text-amber-400">{cycle._count.appraisals - completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisals table */}
      {cycle.appraisals.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Employee Appraisals</h2>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Department</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Self</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Manager</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {cycle.appraisals.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{a.employee.firstName} {a.employee.lastName}</p>
                      {a.employee.jobTitle && <p className="text-xs text-muted-foreground">{a.employee.jobTitle}</p>}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{a.employee.department ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{a.selfRating ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{a.managerRating ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${APPRAISAL_STATUS_STYLES[a.status] ?? ""}`}>
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/africs/hr/appraisals/${a.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cycle.status === "draft" && cycle.appraisals.length === 0 && (
        <div className="border rounded-lg p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground mb-2">This cycle is in draft mode</p>
          <p className="text-xs text-muted-foreground">Activate the cycle to generate appraisal records for all active employees</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={handleActivate} disabled={isPending}>
            <Play className="h-3 w-3" />Activate Cycle
          </Button>
        </div>
      )}
    </div>
  );
}
