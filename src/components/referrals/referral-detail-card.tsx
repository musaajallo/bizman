"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateReferralStatus, deleteReferral } from "@/lib/actions/referrals";
import { Mail, Phone, Linkedin, Briefcase, Trash2 } from "lucide-react";
import Link from "next/link";

const STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "interviewing", label: "Interviewing" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

interface Props {
  referral: {
    id: string;
    candidateName: string;
    candidateEmail: string | null;
    candidatePhone: string | null;
    candidateLinkedIn: string | null;
    positionTitle: string;
    department: string | null;
    status: string;
    reviewNote: string | null;
    notes: string | null;
    createdAt: string;
    referrer: { id: string; firstName: string; lastName: string; jobTitle: string | null; department: string | null } | null;
    jobPosting: { id: string; title: string; status: string } | null;
  };
}

export function ReferralDetailCard({ referral }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(referral.status);
  const [reviewNote, setReviewNote] = useState(referral.reviewNote ?? "");
  const [showNote, setShowNote] = useState(false);

  function handleStatusChange(val: string | null) {
    if (!val) return;
    setStatus(val);
    startTransition(async () => { await updateReferralStatus(referral.id, val); });
  }

  function handleSaveNote() {
    startTransition(async () => {
      await updateReferralStatus(referral.id, status, reviewNote);
      setShowNote(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this referral?")) return;
    startTransition(async () => {
      await deleteReferral(referral.id);
      router.push("/africs/hr/referrals");
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{referral.candidateName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                {referral.jobPosting ? (
                  <Link href={`/africs/hr/recruitment/postings/${referral.jobPosting.id}`} className="text-primary hover:underline">
                    {referral.jobPosting.title}
                  </Link>
                ) : (
                  referral.positionTitle
                )}
                {referral.department && ` · ${referral.department}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
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
          {/* Contact */}
          <div className="flex flex-wrap gap-4 text-sm">
            {referral.candidateEmail && (
              <a href={`mailto:${referral.candidateEmail}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" />{referral.candidateEmail}
              </a>
            )}
            {referral.candidatePhone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{referral.candidatePhone}
              </span>
            )}
            {referral.candidateLinkedIn && (
              <a
                href={referral.candidateLinkedIn.startsWith("http") ? referral.candidateLinkedIn : `https://${referral.candidateLinkedIn}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" />LinkedIn
              </a>
            )}
          </div>

          {/* Referred by */}
          {referral.referrer && (
            <div className="text-sm">
              <span className="text-muted-foreground">Referred by </span>
              <Link href={`/africs/hr/employees/${referral.referrer.id}`} className="text-primary hover:underline font-medium">
                {referral.referrer.firstName} {referral.referrer.lastName}
              </Link>
              {referral.referrer.jobTitle && <span className="text-muted-foreground"> · {referral.referrer.jobTitle}</span>}
            </div>
          )}

          {referral.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Referrer Notes</p>
                <p className="text-sm">{referral.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Review note */}
          {referral.reviewNote && !showNote && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Review Note</p>
              <p className="text-sm">{referral.reviewNote}</p>
              <button onClick={() => setShowNote(true)} className="text-xs text-primary hover:underline mt-1">Edit note</button>
            </div>
          )}

          {(!referral.reviewNote || showNote) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Review Note</p>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                placeholder="Add a note about this referral..."
                className="text-sm"
              />
              <Button size="sm" variant="outline" className="text-xs" onClick={handleSaveNote} disabled={isPending}>
                Save Note
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Submitted {new Date(referral.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
