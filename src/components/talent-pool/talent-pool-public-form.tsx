"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitTalentPoolApplication } from "@/lib/actions/talent-pool";
import { X } from "lucide-react";

const DEPARTMENTS = ["Technology", "Finance", "Operations", "Administration", "Sales & Marketing", "Human Resources", "Legal", "Other"];
const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0–2 years)" },
  { value: "mid", label: "Mid-level (2–5 years)" },
  { value: "senior", label: "Senior (5–10 years)" },
  { value: "lead", label: "Lead / Principal (10+ years)" },
  { value: "executive", label: "Executive / C-level" },
];

export function TalentPoolPublicForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [department, setDepartment] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((p) => [...p, s]);
    setSkillInput("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("skills", skills.join(","));
    fd.set("department", department);
    fd.set("experienceLevel", experienceLevel);

    startTransition(async () => {
      const result = await submitTalentPoolApplication(fd);
      if (result?.error) { setError(result.error); return; }
      router.push("/talent-pool/success");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" required placeholder="Fatou Jallow" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" name="email" type="email" required placeholder="fatou@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" placeholder="+220 XXX XXXX" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
          <Input id="linkedInUrl" name="linkedInUrl" placeholder="linkedin.com/in/yourprofile" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="desiredRole">Desired Role / Title</Label>
          <Input id="desiredRole" name="desiredRole" placeholder="e.g. Software Engineer" />
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
      </div>

      <div className="space-y-1.5">
        <Label>Experience Level</Label>
        <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
          <SelectContent>
            {EXPERIENCE_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Skills</Label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="e.g. React, Python, Excel"
          />
          <Button type="button" variant="outline" onClick={addSkill} disabled={!skillInput.trim()}>Add</Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-secondary rounded-full">
                {s}
                <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Cover Note</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Tell us about yourself and what you're looking for..." />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
