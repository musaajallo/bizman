"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { applyCreditNote } from "@/lib/actions/invoices";

interface Props {
  creditNoteId: string;
  creditNoteNumber: string;
  defaultInvoiceId?: string;
  defaultInvoiceNumber?: string;
}

export function CreditNoteApplyDialog({ creditNoteId, creditNoteNumber, defaultInvoiceId, defaultInvoiceNumber }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targetInvoiceId, setTargetInvoiceId] = useState(defaultInvoiceId || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    if (!targetInvoiceId.trim()) {
      setError("Invoice ID is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await applyCreditNote(creditNoteId, targetInvoiceId.trim());
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
          <CheckCircle className="h-3.5 w-3.5" />
          Apply to Invoice
        </Button>
      } />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Apply Credit Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Apply <span className="font-mono font-medium text-foreground">{creditNoteNumber}</span> to an invoice.
            This will reduce the invoice&apos;s outstanding balance.
          </p>
          {!defaultInvoiceId ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Target Invoice ID</Label>
              <Input
                value={targetInvoiceId}
                onChange={(e) => setTargetInvoiceId(e.target.value)}
                placeholder="Paste invoice ID"
                className="h-9 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Find the ID in the invoice URL: /invoices/[id]
              </p>
            </div>
          ) : (
            <div className="p-2 rounded-md bg-muted text-sm font-mono">
              {defaultInvoiceNumber || defaultInvoiceId}
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply Credit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
