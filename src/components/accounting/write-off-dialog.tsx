"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { writeOffReceivable, recoverWrittenOff } from "@/lib/actions/accounting/bad-debts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "write-off" | "recovery";
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  outstanding: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function WriteOffDialog({ open, onOpenChange, mode, invoiceId, invoiceNumber, clientName, outstanding }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isWriteOff = mode === "write-off";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd      = new FormData(e.currentTarget);
    const amount  = parseFloat(fd.get("amount") as string);
    const desc    = fd.get("description") as string;

    if (isNaN(amount) || amount <= 0) { setError("Enter a valid amount"); return; }

    startTransition(async () => {
      const action = isWriteOff ? writeOffReceivable : recoverWrittenOff;
      const res = await action({ invoiceId, amount, description: desc || undefined });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isWriteOff ? "Write Off Receivable" : "Record Recovery"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-secondary/40 px-3 py-2.5 text-sm space-y-0.5">
            <p><span className="text-muted-foreground">Invoice:</span> <span className="font-medium">{invoiceNumber}</span></p>
            <p><span className="text-muted-foreground">Client:</span> {clientName}</p>
            <p><span className="text-muted-foreground">Outstanding:</span> <span className="font-mono">{fmt(outstanding)}</span></p>
          </div>

          {isWriteOff && (
            <p className="text-xs text-muted-foreground">
              Posts: DR 1110 Allowance for Doubtful Accounts / CR 1100 Accounts Receivable.
              The existing provision absorbs the loss — no P&amp;L impact.
            </p>
          )}
          {!isWriteOff && (
            <p className="text-xs text-muted-foreground">
              Posts two entries: (1) reverse the write-off — DR 1100 / CR 1110; (2) record cash — DR 1000 / CR 1100.
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={outstanding}
              defaultValue={outstanding.toFixed(2)}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Input
              name="description"
              className="h-9 text-sm"
              placeholder={`${isWriteOff ? "Write-off" : "Recovery"}: ${invoiceNumber} — ${clientName}`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isPending}
              variant={isWriteOff ? "destructive" : "default"}
            >
              {isPending ? "Posting…" : isWriteOff ? "Write Off" : "Record Recovery"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
