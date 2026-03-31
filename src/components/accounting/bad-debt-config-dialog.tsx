"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { saveBadDebtConfig, type AgingBucket } from "@/lib/actions/accounting/bad-debts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  buckets: AgingBucket[];
}

export function BadDebtConfigDialog({ open, onOpenChange, buckets }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState<AgingBucket[]>(buckets);
  const [error, setError] = useState<string | null>(null);

  function updateBucket(i: number, field: keyof AgingBucket, value: string | number | null) {
    setLocal((prev) => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveBadDebtConfig(local);
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Allowance Reserve Rates</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            Set the reserve percentage applied to outstanding AR for each aging bucket.
            The required allowance is calculated by multiplying each bucket&apos;s gross AR by its rate.
          </p>
          <div className="space-y-2">
            {local.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <Input
                    value={b.bucketLabel}
                    onChange={(e) => updateBucket(i, "bucketLabel", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={b.reservePercent}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(e) => updateBucket(i, "reservePercent", parseFloat(e.target.value))}
                    className="h-8 text-sm w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save Rates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
