"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateJobPostingStatus, deleteJobPosting, moveApplicationStage } from "@/lib/actions/recruitment";
import { MapPin, Briefcase, DollarSign, Pencil, Trash2, ExternalLink } from "lucide-react";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
];

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

const STAGE_STYLES: Record<string, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  screening: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  interview: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  offer: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  hired: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string | null;
  stage: string;
  rating: number | null;
  createdAt: string;
  talentPoolEntry: { id: string; name: string; email: string } | null;
}

interface Props {
  posting: {
    id: string;
    title: string;
    department: string | null;
    employmentType: string | null;
    location: string | null;
    isRemote: boolean;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    description: string | null;
    requirements: string | null;
    status: string;
    publishedAt: string | null;
    createdAt: string;
    _count: { applications: number };
    applications: Application[];
  };
}

export function PostingDetailCard({ posting }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(posting.status);

  function handleStatusChange(val: string | null) {
    if (!val) return;
    setStatus(val);
    startTransition(async () => { await updateJobPostingStatus(posting.id, val); });
  }

  function handleDelete() {
    if (!confirm("Delete this job posting and all its applications?")) return;
    startTransition(async () => {
      await deleteJobPosting(posting.id);
      router.push("/africs/hr/recruitment");
    });
  }

  function handleMoveStage(appId: string, stage: string) {
    startTransition(async () => { await moveApplicationStage(appId, stage); });
  }

  const byStage: Record<string, Application[]> = {};
  for (const stage of STAGES) byStage[stage] = [];
  for (const app of posting.applications) {
    if (byStage[app.stage]) byStage[app.stage].push(app);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{posting.title}</CardTitle>
              <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                {posting.department && (
                  <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{posting.department}</span>
                )}
                {posting.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{posting.location}{posting.isRemote ? " · Remote" : ""}</span>
                )}
                {(posting.salaryMin || posting.salaryMax) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {posting.salaryCurrency} {posting.salaryMin?.toLocaleString() ?? "?"} – {posting.salaryMax?.toLocaleString() ?? "?"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Link href={`/africs/hr/recruitment/postings/${posting.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {posting.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-line">{posting.description}</p>
            </div>
          )}
          {posting.requirements && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Requirements</p>
                <p className="text-sm whitespace-pre-line">{posting.requirements}</p>
              </div>
            </>
          )}
          <Separator />
          <p className="text-xs text-muted-foreground">
            Created {new Date(posting.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
            {posting.publishedAt && ` · Published ${new Date(posting.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
            {" · "}{posting._count.applications} application{posting._count.applications !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Applications pipeline */}
      <div>
        <h2 className="text-base font-semibold mb-3">Applications ({posting._count.applications})</h2>
        {posting.applications.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">No applications yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {STAGES.map((stage) => (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium capitalize text-muted-foreground">{stage}</span>
                  <span className="text-xs font-mono text-muted-foreground">{byStage[stage].length}</span>
                </div>
                <div className="space-y-1.5 min-h-[60px]">
                  {byStage[stage].map((app) => (
                    <div key={app.id} className="rounded-md border bg-card p-2 text-xs">
                      <Link href={`/africs/hr/recruitment/applications/${app.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                        {app.candidateName}
                      </Link>
                      {app.candidateEmail && <p className="text-muted-foreground truncate mt-0.5">{app.candidateEmail}</p>}
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {STAGES.filter((s) => s !== stage && s !== "rejected").map((s) => (
                          <button
                            key={s}
                            onClick={() => handleMoveStage(app.id, s)}
                            disabled={isPending}
                            className="text-[9px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors capitalize"
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applicants table (quick view) */}
      {posting.applications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">All Applicants</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {posting.applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{app.candidateName}</p>
                    {app.candidateEmail && <p className="text-xs text-muted-foreground">{app.candidateEmail}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border capitalize ${STAGE_STYLES[app.stage] ?? ""}`}>
                      {app.stage}
                    </span>
                    <Link
                      href={`/africs/hr/recruitment/applications/${app.id}`}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
