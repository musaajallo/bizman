"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMaintenance } from "@/lib/actions/assets";
import { MAINTENANCE_STATUSES } from "@/lib/asset-constants";
import { Wrench } from "lucide-react";

interface Props {
  assetId: string;
  currency?: string;
}

export function AssetMaintenanceForm({ assetId, currency = "GMD" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createMaintenance(assetId, fd);
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
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Wrench className="h-3.5 w-3.5" />Log Maintenance
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setError(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Maintenance</DialogTitle></DialogHeader>
          <form id="maint-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="maint-title">Title *</Label>
              <Input id="maint-title" name="title" required placeholder="e.g. Annual servicing" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="maint-date">Date *</Label>
                <Input id="maint-date" name="maintenanceDate" type="date" defaultValue={new Date().toISOString().substring(0, 10)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maint-next">Next Due</Label>
                <Input id="maint-next" name="nextMaintenanceDate" type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="maint-status">Status</Label>
                <Select name="status" defaultValue="completed">
                  <SelectTrigger id="maint-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MAINTENANCE_STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maint-cost">Cost</Label>
                <Input id="maint-cost" name="cost" type="number" min="0" step="any" placeholder="0.00" />
              </div>
            </div>
            <input type="hidden" name="currency" value={currency} />
            <div className="space-y-1.5">
              <Label htmlFor="maint-by">Performed By</Label>
              <Input id="maint-by" name="performedBy" placeholder="Technician / company name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maint-desc">Description</Label>
              <Textarea id="maint-desc" name="description" rows={2} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button form="maint-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
