"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { runMonthlyDepreciation } from "@/lib/actions/assets";

interface Period {
  id: string;
  name: string;
}

interface Result {
  processed: number;
  skipped: number;
  errors: string[];
}

export function AssetRunDepreciationDialog({ periods }: { periods: Period[] }) {
  const [open, setOpen] = useState(false);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    if (!periodId) return;
    startTransition(async () => {
      const r = await runMonthlyDepreciation(periodId);
      setResult(r);
      router.refresh();
    });
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setPeriodId(periods[0]?.id ?? "");
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <TrendingDown className="h-4 w-4" />
        Run Depreciation
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Run Monthly Depreciation</DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will post depreciation journal entries for all active depreciable assets for the selected period.
              </p>
              <div className="space-y-2">
                <Label>Accounting Period</Label>
                {periods.length === 0 ? (
                  <p className="text-sm text-destructive">No open accounting periods found.</p>
                ) : (
                  <Select value={periodId} onValueChange={(v) => v && setPeriodId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleRun} disabled={isPending || !periodId || periods.length === 0}>
                  {isPending ? "Running…" : "Run"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Depreciation run complete</span>
              </div>
              <dl className="text-sm space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Entries posted</dt>
                  <dd className="font-medium">{result.processed}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Skipped (already done)</dt>
                  <dd className="font-medium">{result.skipped}</dd>
                </div>
              </dl>
              {result.errors.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {result.errors.length} error(s)
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground pl-6">{e}</p>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button onClick={handleClose}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
