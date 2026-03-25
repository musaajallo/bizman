"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { submitSelfAssessment, submitManagerReview } from "@/lib/actions/appraisals";
import { Star, UserCheck, User } from "lucide-react";

interface Rating {
  id: string;
  criterion: string;
  selfScore: number | null;
  managerScore: number | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  progress: number;
}

interface Props {
  appraisal: {
    id: string;
    status: string;
    selfRating: number | null;
    selfComments: string | null;
    selfSubmittedAt: string | null;
    managerRating: number | null;
    managerComments: string | null;
    managerSubmittedAt: string | null;
    finalRating: number | null;
    cycle: { id: string; name: string };
    employee: { id: string; firstName: string; lastName: string; jobTitle: string | null; department: string | null };
    ratings: Rating[];
    goals: Goal[];
  };
}

function StarRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={disabled ? "cursor-default" : ""}
        >
          <Star className={`h-5 w-5 transition-colors ${star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

const GOAL_STATUS_STYLES: Record<string, string> = {
  not_started: "bg-zinc-500/10 text-zinc-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-red-500/10 text-red-400",
};

export function AppraisalDetailCard({ appraisal }: Props) {
  const [isPending, startTransition] = useTransition();

  // Self assessment state
  const [selfRating, setSelfRating] = useState(appraisal.selfRating ?? 0);
  const [selfComments, setSelfComments] = useState(appraisal.selfComments ?? "");
  const [selfScores, setSelfScores] = useState<Record<string, number>>(
    Object.fromEntries(appraisal.ratings.map((r) => [r.criterion, r.selfScore ?? 0]))
  );

  // Manager review state
  const [managerRating, setManagerRating] = useState(appraisal.managerRating ?? 0);
  const [managerComments, setManagerComments] = useState(appraisal.managerComments ?? "");
  const [managerScores, setManagerScores] = useState<Record<string, number>>(
    Object.fromEntries(appraisal.ratings.map((r) => [r.criterion, r.managerScore ?? 0]))
  );

  const [selfSaved, setSelfSaved] = useState(false);
  const [managerSaved, setManagerSaved] = useState(false);

  function handleSelfSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitSelfAssessment(appraisal.id, {
        selfRating,
        selfComments,
        ratings: Object.entries(selfScores).map(([criterion, selfScore]) => ({ criterion, selfScore })),
      });
      setSelfSaved(true);
      setTimeout(() => setSelfSaved(false), 2000);
    });
  }

  function handleManagerSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitManagerReview(appraisal.id, {
        managerRating,
        managerComments,
        ratings: Object.entries(managerScores).map(([criterion, managerScore]) => ({ criterion, managerScore })),
      });
      setManagerSaved(true);
      setTimeout(() => setManagerSaved(false), 2000);
    });
  }

  const selfDone = appraisal.status !== "pending";
  const managerDone = appraisal.status === "completed";

  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    self_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    manager_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{appraisal.employee.firstName} {appraisal.employee.lastName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {appraisal.employee.jobTitle ?? appraisal.employee.department ?? "—"}
              </p>
              <Link href={`/africs/hr/appraisals/cycles/${appraisal.cycle.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                {appraisal.cycle.name}
              </Link>
            </div>
            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${STATUS_STYLES[appraisal.status] ?? ""}`}>
              {appraisal.status.replace(/_/g, " ")}
            </span>
          </div>
        </CardHeader>
        {appraisal.finalRating && (
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Final Rating</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= appraisal.finalRating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              <span className="text-sm font-mono font-semibold">{appraisal.finalRating}/5</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Goals */}
      {appraisal.goals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Goals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {appraisal.goals.map((g) => (
              <div key={g.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{g.title}</p>
                  {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                  {g.targetDate && <p className="text-xs text-muted-foreground">Target: {new Date(g.targetDate).toLocaleDateString("en-GB")}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full capitalize ${GOAL_STATUS_STYLES[g.status] ?? ""}`}>
                    {g.status.replace(/_/g, " ")}
                  </span>
                  {g.progress > 0 && <span className="text-xs font-mono text-muted-foreground">{g.progress}%</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Self Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-blue-400" />Self Assessment
            {selfDone && appraisal.selfSubmittedAt && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Submitted {new Date(appraisal.selfSubmittedAt).toLocaleDateString("en-GB")}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selfDone ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Overall Self Rating</p>
                <StarRating value={appraisal.selfRating ?? 0} onChange={() => {}} disabled />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {appraisal.ratings.map((r) => (
                  <div key={r.criterion} className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{r.criterion}</span>
                    <span className="font-mono">{r.selfScore ?? "—"}/5</span>
                  </div>
                ))}
              </div>
              {appraisal.selfComments && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comments</p>
                  <p className="text-sm">{appraisal.selfComments}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSelfSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Overall Rating</Label>
                <StarRating value={selfRating} onChange={setSelfRating} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Criteria Ratings</Label>
                {appraisal.ratings.map((r) => (
                  <div key={r.criterion} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{r.criterion}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelfScores((prev) => ({ ...prev, [r.criterion]: s }))}
                        >
                          <Star className={`h-4 w-4 ${s <= (selfScores[r.criterion] ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="selfComments" className="text-xs">Self-Assessment Comments</Label>
                <Textarea
                  id="selfComments"
                  value={selfComments}
                  onChange={(e) => setSelfComments(e.target.value)}
                  rows={3}
                  placeholder="Describe your achievements and areas for improvement..."
                />
              </div>
              <Button type="submit" size="sm" disabled={isPending || selfRating === 0}>
                {isPending ? "Saving…" : selfSaved ? "Saved!" : "Submit Self Assessment"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Manager Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-amber-400" />Manager Review
            {managerDone && appraisal.managerSubmittedAt && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Submitted {new Date(appraisal.managerSubmittedAt).toLocaleDateString("en-GB")}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {managerDone ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Overall Manager Rating</p>
                <StarRating value={appraisal.managerRating ?? 0} onChange={() => {}} disabled />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {appraisal.ratings.map((r) => (
                  <div key={r.criterion} className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{r.criterion}</span>
                    <span className="font-mono">{r.managerScore ?? "—"}/5</span>
                  </div>
                ))}
              </div>
              {appraisal.managerComments && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comments</p>
                  <p className="text-sm">{appraisal.managerComments}</p>
                </div>
              )}
            </div>
          ) : appraisal.status === "manager_review" ? (
            <form onSubmit={handleManagerSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Overall Rating</Label>
                <StarRating value={managerRating} onChange={setManagerRating} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Criteria Ratings</Label>
                {appraisal.ratings.map((r) => (
                  <div key={r.criterion} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{r.criterion}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setManagerScores((prev) => ({ ...prev, [r.criterion]: s }))}
                        >
                          <Star className={`h-4 w-4 ${s <= (managerScores[r.criterion] ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="managerComments" className="text-xs">Manager Comments</Label>
                <Textarea
                  id="managerComments"
                  value={managerComments}
                  onChange={(e) => setManagerComments(e.target.value)}
                  rows={3}
                  placeholder="Provide your assessment and feedback..."
                />
              </div>
              <Button type="submit" size="sm" disabled={isPending || managerRating === 0}>
                {isPending ? "Saving…" : managerSaved ? "Saved!" : "Submit Manager Review"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for self-assessment to be completed first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
