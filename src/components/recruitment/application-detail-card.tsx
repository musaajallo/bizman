"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { moveApplicationStage, rateApplication, addApplicationNote, rejectApplication, linkApplicationToEmployee, unlinkApplicationEmployee } from "@/lib/actions/recruitment";
import { Mail, Phone, Linkedin, ExternalLink, Star, UserCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";

const STAGES = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const STAGE_STYLES: Record<string, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  screening: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  interview: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  offer: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  hired: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

interface Employee { id: string; firstName: string; lastName: string; employeeNumber: string; }

interface Props {
  application: {
    id: string;
    candidateName: string;
    candidateEmail: string | null;
    candidatePhone: string | null;
    resumeUrl: string | null;
    coverLetter: string | null;
    stage: string;
    rating: number | null;
    notes: string | null;
    rejectionReason: string | null;
    hiredEmployeeId: string | null;
    hiredEmployee: { id: string; firstName: string; lastName: string; employeeNumber: string } | null;
    createdAt: string;
    jobPosting: { id: string; title: string; department: string | null };
    talentPoolEntry: {
      id: string; name: string; email: string; phone: string | null;
      linkedInUrl: string | null; skills: string[]; experienceLevel: string | null;
    } | null;
  };
  employees?: Employee[];
}

export function ApplicationDetailCard({ application, employees = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState(application.stage);
  const [rating, setRating] = useState(application.rating ?? 0);
  const [notes, setNotes] = useState(application.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [linkedEmployee, setLinkedEmployee] = useState(application.hiredEmployee);

  function handleStageChange(val: string | null) {
    if (!val) return;
    setStage(val);
    startTransition(async () => { await moveApplicationStage(application.id, val); });
  }

  function handleRate(star: number) {
    setRating(star);
    startTransition(async () => { await rateApplication(application.id, star); });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await addApplicationNote(application.id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectApplication(application.id, rejectReason || undefined);
      setStage("rejected");
      setShowRejectForm(false);
    });
  }

  function handleLinkEmployee() {
    if (!selectedEmployeeId) return;
    const emp = employees.find((e) => e.id === selectedEmployeeId) ?? null;
    startTransition(async () => {
      await linkApplicationToEmployee(application.id, selectedEmployeeId);
      setLinkedEmployee(emp);
      setStage("hired");
      setLinkOpen(false);
    });
  }

  function handleUnlink() {
    startTransition(async () => {
      await unlinkApplicationEmployee(application.id);
      setLinkedEmployee(null);
    });
  }

  const tp = application.talentPoolEntry;

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{application.candidateName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Applying for:{" "}
                <Link href={`/africs/hr/recruitment/postings/${application.jobPosting.id}`} className="text-primary hover:underline">
                  {application.jobPosting.title}
                </Link>
                {application.jobPosting.department && ` · ${application.jobPosting.department}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={stage} onValueChange={handleStageChange} disabled={isPending}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact */}
          <div className="flex flex-wrap gap-4 text-sm">
            {application.candidateEmail && (
              <a href={`mailto:${application.candidateEmail}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" />{application.candidateEmail}
              </a>
            )}
            {application.candidatePhone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{application.candidatePhone}
              </span>
            )}
            {tp?.linkedInUrl && (
              <a href={tp.linkedInUrl.startsWith("http") ? tp.linkedInUrl : `https://${tp.linkedInUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                <Linkedin className="h-3.5 w-3.5" />LinkedIn
              </a>
            )}
            {application.resumeUrl && (
              <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />Resume
              </a>
            )}
          </div>

          {/* Talent pool link */}
          {tp && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-md px-3 py-2">
              <span>From talent pool</span>
              <Link href={`/africs/hr/talent-pool/${tp.id}`} className="text-primary hover:underline">
                View profile →
              </Link>
              {tp.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-2">
                  {tp.skills.slice(0, 4).map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={isPending}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {application.coverLetter && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cover Letter</p>
                <p className="text-sm whitespace-pre-line">{application.coverLetter}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Notes */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Internal Notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this candidate..."
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs"
              onClick={handleSaveNotes}
              disabled={isPending}
            >
              {notesSaved ? "Saved!" : "Save Notes"}
            </Button>
          </div>

          {/* Reject */}
          {stage !== "rejected" && (
            <>
              <Separator />
              {showRejectForm ? (
                <div className="space-y-2">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Rejection reason (optional)"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={handleReject} disabled={isPending}>Confirm Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive" onClick={() => setShowRejectForm(true)}>
                  Reject Candidate
                </Button>
              )}
            </>
          )}

          {application.rejectionReason && (
            <p className="text-xs text-muted-foreground">
              Rejection reason: {application.rejectionReason}
            </p>
          )}

          {/* Employee link */}
          {(stage === "hired" || linkedEmployee) && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Linked Employee Record</p>
                {linkedEmployee ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium flex-1">{linkedEmployee.firstName} {linkedEmployee.lastName}</span>
                    <span className="text-xs text-muted-foreground font-mono">{linkedEmployee.employeeNumber}</span>
                    <Link href={`/africs/hr/employees/${linkedEmployee.id}`} className="text-xs text-primary hover:underline ml-2">View →</Link>
                    <button onClick={handleUnlink} disabled={isPending} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => setLinkOpen(true)} disabled={isPending}>
                    <UserCheck className="h-3.5 w-3.5" />Link to Employee Record
                  </Button>
                )}
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Applied {new Date(application.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </CardContent>
      </Card>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Link to Employee</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select the employee record created for this hire.</p>
          <Select value={selectedEmployeeId} onValueChange={(v: string | null) => { if (v) setSelectedEmployeeId(v); }}>
            <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} · {e.employeeNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkEmployee} disabled={!selectedEmployeeId || isPending}>Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
