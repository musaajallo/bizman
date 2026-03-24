"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignAsset } from "@/lib/actions/assets";
import { UserPlus } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
}

interface Props {
  assetId: string;
  employees: Employee[];
}

export function AssetAssignDialog({ assetId, employees }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await assignAsset(assetId, fd);
      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-3.5 w-3.5" />Assign
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setError(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Asset</DialogTitle></DialogHeader>
          <form id="assign-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee (optional)</Label>
              <Select name="employeeId">
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}{e.jobTitle ? ` — ${e.jobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-location">Location (optional)</Label>
              <Input id="assign-location" name="location" placeholder="e.g. Branch Office" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-notes">Notes</Label>
              <Textarea id="assign-notes" name="notes" rows={2} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button form="assign-form" type="submit" disabled={isPending}>
              {isPending ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
