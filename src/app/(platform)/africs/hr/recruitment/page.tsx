import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getJobPostings, getRecruitmentStats } from "@/lib/actions/recruitment";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ExternalLink, Briefcase, Users, TrendingUp, CheckCircle2 } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  filled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const STAGE_LABELS = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const filters = await searchParams;
  const activeStatus = filters.status ?? "";

  const [stats, postings] = await Promise.all([
    getRecruitmentStats(),
    getJobPostings(filters.status ? { status: filters.status } : undefined),
  ]);

  return (
    <div>
      <TopBar
        title="Recruitment"
        subtitle="Job postings and hiring pipeline"
        actions={
          <Link href="/africs/hr/recruitment/postings/new">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Posting</Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open Positions", value: stats.openPositions, icon: Briefcase, color: "text-emerald-400" },
            { label: "Total Applications", value: stats.totalApplications, icon: Users, color: "text-primary" },
            { label: "Interviewing", value: stats.byStage.interview ?? 0, icon: TrendingUp, color: "text-amber-400" },
            { label: "Hired", value: stats.byStage.hired ?? 0, icon: CheckCircle2, color: "text-blue-400" },
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

        {/* Pipeline breakdown */}
        {stats.totalApplications > 0 && (
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground mb-3">Application Pipeline</p>
            <div className="flex items-end gap-2">
              {STAGE_LABELS.map((stage) => {
                const count = stats.byStage[stage] ?? 0;
                const pct = stats.totalApplications > 0 ? (count / stats.totalApplications) * 100 : 0;
                return (
                  <div key={stage} className="flex-1 text-center">
                    <div className="flex items-end justify-center h-14 mb-1">
                      <div
                        className="w-full rounded-t bg-primary/50"
                        style={{ height: `${Math.max(pct * 0.9, count > 0 ? 12 : 3)}%`, minHeight: count > 0 ? "8px" : "2px" }}
                      />
                    </div>
                    <p className="text-xs font-mono font-semibold">{count}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{stage}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-border pb-0">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/africs/hr/recruitment?status=${tab.value}` : "/africs/hr/recruitment"}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeStatus === tab.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        {postings.length === 0 ? (
          <div className="border rounded-lg p-10 text-center">
            <p className="text-sm text-muted-foreground">No job postings yet</p>
            <Link href="/africs/hr/recruitment/postings/new" className="text-xs text-primary hover:underline mt-2 inline-block">
              Create first posting
            </Link>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Position</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Department</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Apps</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {postings.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{p.title}</p>
                      {p.location && (
                        <p className="text-xs text-muted-foreground">{p.location}{p.isRemote ? " · Remote" : ""}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{p.department ?? "—"}</td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground capitalize">
                      {p.employmentType?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-mono">{p._count.applications}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_STYLES[p.status] ?? ""}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/africs/hr/recruitment/postings/${p.id}`}
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
