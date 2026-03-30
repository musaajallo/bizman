"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateTalentPoolStatus, deleteTalentPoolEntry } from "@/lib/actions/talent-pool";
import { Mail, Phone, Linkedin, Briefcase, ExternalLink, Trash2 } from "lucide-react";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "archived", label: "Archived" },
];

const EXP_LABELS: Record<string, string> = {
  junior: "Junior (0–2 yrs)", mid: "Mid-level (2–5 yrs)", senior: "Senior (5–10 yrs)",
  lead: "Lead / Principal (10+ yrs)", executive: "Executive / C-level",
};

interface Props {
  entry: {
    id: string; name: string; email: string; phone: string | null; linkedInUrl: string | null;
    desiredRole: string | null; department: string | null; skills: string[];
    experienceLevel: string | null; resumeUrl: string | null; notes: string | null;
    status: string; source: string; createdAt: string;
    applications: { id: string; stage: string; jobPosting: { id: string; title: string; status: string } | null }[];
  };
}

export function TalentPoolDetailCard({ entry }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(entry.status);

  function handleStatusChange(val: string | null) {
    if (!val) return;
    setStatus(val);
    startTransition(async () => { await updateTalentPoolStatus(entry.id, val); });
  }

  function handleDelete() {
    if (!confirm("Delete this candidate from the talent pool?")) return;
    startTransition(async () => {
      await deleteTalentPoolEntry(entry.id);
      router.push("/africs/hr/talent-pool");
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{entry.name}</CardTitle>
              {entry.desiredRole && <p className="text-sm text-muted-foreground mt-0.5">{entry.desiredRole}{entry.department ? ` · ${entry.department}` : ""}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={`mailto:${entry.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
              <Mail className="h-3.5 w-3.5" />{entry.email}
            </a>
            {entry.phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{entry.phone}
              </span>
            )}
            {entry.linkedInUrl && (
              <a href={entry.linkedInUrl.startsWith("http") ? entry.linkedInUrl : `https://${entry.linkedInUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                <Linkedin className="h-3.5 w-3.5" />LinkedIn
              </a>
            )}
          </div>

          {entry.experienceLevel && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              {EXP_LABELS[entry.experienceLevel] ?? entry.experienceLevel}
            </div>
          )}

          {entry.skills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-xs bg-secondary rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {entry.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cover Note</p>
                <p className="text-sm">{entry.notes}</p>
              </div>
            </>
          )}

          {entry.resumeUrl && (
            <a href={entry.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />View Resume
            </a>
          )}

          <Separator />
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} · Source: {entry.source.replace("_", " ")}
          </p>
        </CardContent>
      </Card>

      {entry.applications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Applications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entry.applications.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.jobPosting?.title ?? "Unknown posting"}</span>
                  <span className="text-xs text-muted-foreground capitalize">{a.stage}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
