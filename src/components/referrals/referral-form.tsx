"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createReferral } from "@/lib/actions/referrals";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
}

interface JobPosting {
  id: string;
  title: string;
  department: string | null;
}

interface Props {
  employees: Employee[];
  openPostings: JobPosting[];
}

export function ReferralForm({ employees, openPostings }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState("");
  const [jobPostingId, setJobPostingId] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!referrerId) { setError("Please select the referring employee."); return; }

    const fd = new FormData(e.currentTarget);
    fd.set("referrerId", referrerId);
    fd.set("jobPostingId", jobPostingId);

    // Set positionTitle from job posting or from manual field
    if (jobPostingId) {
      const posting = openPostings.find((p) => p.id === jobPostingId);
      if (posting && !fd.get("positionTitle")) fd.set("positionTitle", posting.title);
    }

    startTransition(async () => {
      const result = await createReferral(fd);
      if (result?.error) { setError(result.error); return; }
      router.push(`/africs/hr/referrals/${result.id}`);
    });
  }

  const selectedPosting = openPostings.find((p) => p.id === jobPostingId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-1.5">
        <Label>Referred By (Employee) *</Label>
        <Select value={referrerId} onValueChange={(v) => setReferrerId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}{e.department ? ` — ${e.department}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Link to Job Posting (optional)</Label>
        <Select value={jobPostingId} onValueChange={(v) => setJobPostingId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select open posting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No specific posting</SelectItem>
            {openPostings.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}{p.department ? ` — ${p.department}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="positionTitle">Position Title *</Label>
        <Input
          id="positionTitle"
          name="positionTitle"
          required={!jobPostingId}
          defaultValue={selectedPosting?.title ?? ""}
          placeholder="e.g. Software Engineer"
        />
        <p className="text-xs text-muted-foreground">Will auto-fill from the posting if selected above</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="candidateName">Candidate Full Name *</Label>
          <Input id="candidateName" name="candidateName" required placeholder="Fatou Ceesay" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="candidateEmail">Candidate Email</Label>
          <Input id="candidateEmail" name="candidateEmail" type="email" placeholder="fatou@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="candidatePhone">Candidate Phone</Label>
          <Input id="candidatePhone" name="candidatePhone" placeholder="+220 XXX XXXX" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="candidateLinkedIn">Candidate LinkedIn</Label>
          <Input id="candidateLinkedIn" name="candidateLinkedIn" placeholder="linkedin.com/in/profile" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Why are you recommending this candidate?" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit Referral"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
