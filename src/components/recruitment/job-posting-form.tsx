"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createJobPosting, updateJobPosting } from "@/lib/actions/recruitment";

const DEPARTMENTS = [
  "Technology", "Finance", "Operations", "Administration",
  "Sales & Marketing", "Human Resources", "Legal", "Other",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

const CURRENCIES = ["GMD", "USD", "EUR", "GBP"];

interface Props {
  posting?: {
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
  };
}

export function JobPostingForm({ posting }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState(posting?.department ?? "");
  const [employmentType, setEmploymentType] = useState(posting?.employmentType ?? "");
  const [currency, setCurrency] = useState(posting?.salaryCurrency ?? "GMD");
  const [isRemote, setIsRemote] = useState(posting?.isRemote ?? false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("department", department);
    fd.set("employmentType", employmentType);
    fd.set("salaryCurrency", currency);
    fd.set("isRemote", String(isRemote));

    startTransition(async () => {
      if (posting) {
        const result = await updateJobPosting(posting.id, fd);
        if (result?.error) { setError(result.error); return; }
        router.push(`/africs/hr/recruitment/postings/${posting.id}`);
      } else {
        const result = await createJobPosting(fd);
        if (result?.error) { setError(result.error); return; }
        router.push(`/africs/hr/recruitment/postings/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Job Title *</Label>
          <Input id="title" name="title" required defaultValue={posting?.title ?? ""} placeholder="e.g. Software Engineer" />
        </div>

        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Employment Type</Label>
          <Select value={employmentType} onValueChange={(v) => setEmploymentType(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={posting?.location ?? ""} placeholder="e.g. Banjul, Gambia" />
        </div>

        <div className="space-y-1.5 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <span className="text-sm">Remote / Hybrid</span>
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Salary Range</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v ?? "GMD")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryMin">Minimum</Label>
            <Input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min="0"
              defaultValue={posting?.salaryMin ?? ""}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryMax">Maximum</Label>
            <Input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min="0"
              defaultValue={posting?.salaryMax ?? ""}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={posting?.description ?? ""}
          placeholder="Describe the role, responsibilities, and team..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea
          id="requirements"
          name="requirements"
          rows={4}
          defaultValue={posting?.requirements ?? ""}
          placeholder="List required skills, experience, and qualifications..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : posting ? "Save Changes" : "Create Posting"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
