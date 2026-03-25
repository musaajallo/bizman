import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getTalentPoolEntries, getTalentPoolStats } from "@/lib/actions/talent-pool";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Users, Star, Eye, Archive, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shortlisted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

const EXP_LABELS: Record<string, string> = {
  junior: "Junior", mid: "Mid-level", senior: "Senior", lead: "Lead", executive: "Executive",
};

export default async function TalentPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string }>;
}) {
  const filters = await searchParams;
  const [stats, entries] = await Promise.all([
    getTalentPoolStats(),
    getTalentPoolEntries(filters),
  ]);

  const activeStatus = filters.status ?? "";

  return (
    <div>
      <TopBar
        title="Talent Pool"
        subtitle="Candidate database and expressions of interest"
        actions={
          <Link href="/talent-pool" target="_blank">
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />Public Form
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "text-primary" },
            { label: "New", value: stats.new, icon: Plus, color: "text-blue-400" },
            { label: "Shortlisted", value: stats.shortlisted, icon: Star, color: "text-emerald-400" },
            { label: "Reviewed", value: stats.reviewed, icon: Eye, color: "text-amber-400" },
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

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-border pb-0">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/africs/hr/talent-pool?status=${tab.value}` : "/africs/hr/talent-pool"}
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
        {entries.length === 0 ? (
          <div className="border rounded-lg p-10 text-center">
            <p className="text-sm text-muted-foreground">No candidates yet</p>
            <Link href="/talent-pool" target="_blank" className="text-xs text-primary hover:underline mt-2 inline-block">
              Open public form
            </Link>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Desired Role</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Experience</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Skills</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.email}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">
                      {e.desiredRole ?? "—"}
                      {e.department && <span className="block text-xs">{e.department}</span>}
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground">
                      {e.experienceLevel ? EXP_LABELS[e.experienceLevel] ?? e.experienceLevel : "—"}
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {e.skills.slice(0, 3).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-[10px] bg-secondary rounded">{s}</span>
                        ))}
                        {e.skills.length > 3 && <span className="text-[10px] text-muted-foreground">+{e.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_STYLES[e.status] ?? ""}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/africs/hr/talent-pool/${e.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
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
