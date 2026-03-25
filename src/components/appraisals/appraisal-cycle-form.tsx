"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAppraisalCycle, updateAppraisalCycle } from "@/lib/actions/appraisals";

interface Props {
  cycle?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export function AppraisalCycleForm({ cycle }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      if (cycle) {
        const result = await updateAppraisalCycle(cycle.id, fd);
        if (result?.error) { setError(result.error); return; }
        router.push(`/africs/hr/appraisals/cycles/${cycle.id}`);
      } else {
        const result = await createAppraisalCycle(fd);
        if (result?.error) { setError(result.error); return; }
        router.push(`/africs/hr/appraisals/cycles/${result.id}`);
      }
    });
  }

  // Format date for input (yyyy-mm-dd)
  function toInputDate(iso: string) {
    return iso.split("T")[0];
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="name">Cycle Name *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={cycle?.name ?? ""}
          placeholder="e.g. H1 2026 Performance Review"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={cycle ? toInputDate(cycle.startDate) : ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={cycle ? toInputDate(cycle.endDate) : ""}
          />
        </div>
      </div>

      {!cycle && (
        <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
          After creating the cycle, you can activate it to automatically generate appraisal records for all active employees.
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : cycle ? "Save Changes" : "Create Cycle"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
