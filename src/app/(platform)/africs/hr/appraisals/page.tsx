import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getAppraisalCycles, getAppraisalStats } from "@/lib/actions/appraisals";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ExternalLink, Award, CheckCircle2, Clock, Star } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

export default async function AppraisalsPage() {
  const [stats, cycles] = await Promise.all([
    getAppraisalStats(),
    getAppraisalCycles(),
  ]);

  return (
    <div>
      <TopBar
        title="Appraisals"
        subtitle="Performance reviews and evaluation cycles"
        actions={
          <Link href="/africs/hr/appraisals/cycles/new">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Cycle</Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Cycles", value: stats.activeCycles, icon: Award, color: "text-primary" },
            { label: "Total Appraisals", value: stats.totalAppraisals, icon: CheckCircle2, color: "text-blue-400" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
            { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", icon: Star, color: "text-emerald-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cycles list */}
        <h2 className="text-base font-semibold">Review Cycles</h2>
        {cycles.length === 0 ? (
          <div className="border rounded-lg p-10 text-center">
            <p className="text-sm text-muted-foreground">No appraisal cycles yet</p>
            <Link href="/africs/hr/appraisals/cycles/new" className="text-xs text-primary hover:underline mt-2 inline-block">
              Create first cycle
            </Link>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cycle Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Period</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Appraisals</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-medium">{c.name}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(c.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      {" – "}
                      {new Date(c.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-mono">{c._count.appraisals}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_STYLES[c.status] ?? ""}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/africs/hr/appraisals/cycles/${c.id}`}
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
        )}
      </div>
    </div>
  );
}
