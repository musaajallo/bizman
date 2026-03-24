"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import { PAYMENT_TERMS } from "@/lib/bill-constants";
import { Separator } from "@/components/ui/separator";

interface ExistingVendor {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  paymentTerms: string;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  notes: string | null;
}

export function VendorForm({ vendor }: { vendor?: ExistingVendor }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentTerms, setPaymentTerms] = useState(vendor?.paymentTerms ?? "net30");

  function onTermsChange(v: string | null) { if (v) setPaymentTerms(v); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("paymentTerms", paymentTerms);

    startTransition(async () => {
      if (vendor) {
        const result = await updateVendor(vendor.id, fd);
        if ("error" in result) { setError(result.error ?? "Error"); return; }
        router.push(`/africs/accounting/vendors/${vendor.id}`);
      } else {
        const result = await createVendor(fd);
        if ("error" in result) { setError(result.error ?? "Error"); return; }
        router.push(`/africs/accounting/vendors/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendor Details</p>
        <div className="space-y-2">
          <Label htmlFor="name">Vendor Name <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" required defaultValue={vendor?.name} placeholder="e.g. Serrekunda Office Supplies" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" name="contactName" defaultValue={vendor?.contactName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={vendor?.email ?? ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={vendor?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={vendor?.website ?? ""} placeholder="https://" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" rows={2} defaultValue={vendor?.address ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Payment Terms</Label>
          <Select value={paymentTerms} onValueChange={onTermsChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Bank details */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bank Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" name="bankName" defaultValue={vendor?.bankName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankBranch">Branch</Label>
            <Input id="bankBranch" name="bankBranch" defaultValue={vendor?.bankBranch ?? ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankAccountName">Account Name</Label>
            <Input id="bankAccountName" name="bankAccountName" defaultValue={vendor?.bankAccountName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Account Number</Label>
            <Input id="bankAccountNumber" name="bankAccountNumber" defaultValue={vendor?.bankAccountNumber ?? ""} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={vendor?.notes ?? ""} placeholder="Internal notes…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : vendor ? "Save Changes" : "Create Vendor"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
      </div>
    </form>
  );
}
