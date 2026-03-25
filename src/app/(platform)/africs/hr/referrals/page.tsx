import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getReferrals, getReferralStats, getReferralLeaderboard } from "@/lib/actions/referrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, Users, CheckCircle2, Trophy, UserRoundPlus } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "interviewing", label: "Interviewing" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  interviewing: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  hired: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const filters = await searchParams;
  const activeStatus = filters.status ?? "";

  const [stats, referrals, leaderboard] = await Promise.all([
    getReferralStats(),
    getReferrals(filters.status ? { status: filters.status } : undefined),
    getReferralLeaderboard(),
  ]);

  return (
    <div>
      <TopBar
        title="Referrals"
        subtitle="Employee referral program"
        actions={
          <Link href="/africs/hr/referrals/new">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Referral</Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Referrals", value: stats.total, icon: Users, color: "text-primary" },
            { label: "Pending Review", value: stats.submitted, icon: UserRoundPlus, color: "text-blue-400" },
            { label: "Interviewing", value: stats.interviewing, icon: CheckCircle2, color: "text-violet-400" },
            { label: "Hired", value: stats.hired, icon: Trophy, color: "text-emerald-400" },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {/* Status tabs */}
            <div className="flex gap-1 border-b border-border pb-0">
              {STATUS_TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={tab.value ? `/africs/hr/referrals?status=${tab.value}` : "/africs/hr/referrals"}
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
            {referrals.length === 0 ? (
              <div className="border rounded-lg p-10 text-center">
                <p className="text-sm text-muted-foreground">No referrals yet</p>
                <Link href="/africs/hr/referrals/new" className="text-xs text-primary hover:underline mt-2 inline-block">
                  Submit first referral
                </Link>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Candidate</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Referred By</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Position</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{r.candidateName}</p>
                          {r.candidateEmail && <p className="text-xs text-muted-foreground">{r.candidateEmail}</p>}
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">
                          {r.referrer ? `${r.referrer.firstName} ${r.referrer.lastName}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground">
                          {r.jobPosting?.title ?? r.positionTitle}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_STYLES[r.status] ?? ""}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/africs/hr/referrals/${r.id}`}
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

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" />Top Referrers</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 8).map((row, idx) => (
                    row.employee && (
                      <div key={row.employee.id} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}</span>
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-medium text-primary">
                            {row.employee.firstName[0]}{row.employee.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{row.employee.firstName} {row.employee.lastName}</p>
                          <p className="text-xs text-muted-foreground">{row.total} referral{row.total !== 1 ? "s" : ""}</p>
                        </div>
                        {row.hired > 0 && (
                          <span className="text-xs font-mono text-emerald-400">{row.hired} hired</span>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
