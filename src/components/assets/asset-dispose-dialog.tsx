"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { disposeAsset } from "@/lib/actions/assets";

interface Props {
  assetId: string;
  assetNumber: string;
  currency: string;
  cost: number;
  accumulatedDepreciation: number;
}

export function AssetDisposeDialog({ assetId, assetNumber, currency, cost, accumulatedDepreciation }: Props) {
  const [open, setOpen] = useState(false);
  const [proceeds, setProceeds] = useState("");
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const proceedsNum = parseFloat(proceeds) || 0;
  const bookValue = cost - accumulatedDepreciation;
  const gainOrLoss = proceedsNum - bookValue;
  const fmt = (n: number) => `${currency} ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  function handleSubmit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("proceeds", proceeds || "0");
      fd.set("disposalDate", disposalDate);
      fd.set("notes", notes);
      const result = await disposeAsset(assetId, fd);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="destructive" className="gap-2" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Dispose Asset
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispose Asset — {assetNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-mono">{fmt(cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accumulated Depreciation</span>
                <span className="font-mono text-amber-400">({fmt(accumulatedDepreciation)})</span>
              </div>
              <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                <span>Book Value</span>
                <span className="font-mono">{fmt(bookValue)}</span>
              </div>
              {proceeds !== "" && (
                <div className={`flex justify-between font-medium border-t border-border pt-1 mt-1 ${gainOrLoss >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                  <span>{gainOrLoss >= 0 ? "Gain on Disposal" : "Loss on Disposal"}</span>
                  <span className="font-mono">{fmt(gainOrLoss)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Disposal Date</Label>
              <Input type="date" value={disposalDate} onChange={(e) => setDisposalDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Proceeds Received (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">{currency}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={proceeds}
                  onChange={(e) => setProceeds(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Reason for disposal, sold to, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              This will post journal entries to remove the asset from the books and record any gain or loss.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Disposing…" : "Confirm Disposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
