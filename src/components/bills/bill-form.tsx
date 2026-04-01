"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBill, updateBill, approveBill } from "@/lib/actions/bills";
import { CategoryPicker } from "@/components/shared/category-picker";
import { parsePaymentTerms } from "@/lib/bill-constants";

interface Vendor { id: string; name: string; paymentTerms: string; }
interface FlatCategory { id: string; name: string; code: string | null; parentId: string | null; }

interface ExistingBill {
  id: string;
  vendorId: string;
  title: string;
  description: string | null;
  referenceNumber: string | null;
  subtotal: number;
  taxRate: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  categoryId: string | null;
  paymentTermsDays: number | null;
  discountPercent: number;
  discountDays: number | null;
}

const CURRENCIES = ["GMD", "USD", "EUR", "GBP", "ZAR", "NGN", "GHS"];

export function BillForm({ vendors, bill, categories = [] }: { vendors: Vendor[]; bill?: ExistingBill; categories?: FlatCategory[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState(bill?.vendorId ?? "");
  const [currency, setCurrency] = useState(bill?.currency ?? "GMD");
  const [subtotal, setSubtotal] = useState(String(bill?.subtotal ?? ""));
  const [taxRate, setTaxRate] = useState(String(bill?.taxRate ?? "0"));
  const [categoryId, setCategoryId] = useState<string | null>(bill?.categoryId ?? null);
  const [issueDate, setIssueDate] = useState(bill ? bill.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(bill?.dueDate.slice(0, 10) ?? "");
  const [paymentTermsDays, setPaymentTermsDays] = useState(String(bill?.paymentTermsDays ?? ""));
  const [discountPercent, setDiscountPercent] = useState(String(bill?.discountPercent ?? ""));
  const [discountDays, setDiscountDays] = useState(String(bill?.discountDays ?? ""));

  const taxAmount = parseFloat(((parseFloat(taxRate) || 0) / 100 * (parseFloat(subtotal) || 0)).toFixed(2));
  const total = (parseFloat(subtotal) || 0) + taxAmount;

  function onVendorChange(v: string | null) {
    if (!v) return;
    setVendorId(v);
    // Auto-fill discount terms from vendor's payment terms
    const vendor = vendors.find((vn) => vn.id === v);
    if (vendor) {
      const terms = parsePaymentTerms(vendor.paymentTerms);
      setPaymentTermsDays(String(terms.netDays));
      setDiscountPercent(String(terms.discountPercent ?? ""));
      setDiscountDays(String(terms.discountDays ?? ""));
      // Auto-compute due date from issue date + netDays
      if (terms.netDays > 0 && issueDate) {
        const due = new Date(issueDate);
        due.setDate(due.getDate() + terms.netDays);
        setDueDate(due.toISOString().slice(0, 10));
      }
    }
  }
  function onCurrencyChange(v: string | null) { if (v) setCurrency(v); }

  function buildFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("vendorId", vendorId);
    fd.set("currency", currency);
    fd.set("issueDate", issueDate);
    fd.set("dueDate", dueDate);
    if (categoryId) fd.set("categoryId", categoryId);
    if (paymentTermsDays) fd.set("paymentTermsDays", paymentTermsDays);
    if (discountPercent) fd.set("discountPercent", discountPercent);
    if (discountDays) fd.set("discountDays", discountDays);
    return fd;
  }

  function handleSaveDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = buildFormData(e.currentTarget);
    startTransition(async () => {
      if (bill) {
        const r = await updateBill(bill.id, fd);
        if ("error" in r) { setError(r.error ?? "Error"); return; }
        router.push(`/africs/accounting/bills/${bill.id}`);
      } else {
        const r = await createBill(fd);
        if ("error" in r) { setError(r.error ?? "Error"); return; }
        router.push(`/africs/accounting/bills/${r.id}`);
      }
    });
  }

  function handleSaveAndApprove(e: React.MouseEvent) {
    e.preventDefault();
    const form = (e.currentTarget as HTMLElement).closest("form") as HTMLFormElement;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    setError(null);
    const fd = buildFormData(form);
    startTransition(async () => {
      if (bill) {
        const r1 = await updateBill(bill.id, fd);
        if ("error" in r1) { setError(r1.error ?? "Error"); return; }
        const r2 = await approveBill(bill.id);
        if ("error" in r2) { setError(r2.error ?? "Error"); return; }
        router.push(`/africs/accounting/bills/${bill.id}`);
      } else {
        const r1 = await createBill(fd);
        if ("error" in r1) { setError(r1.error ?? "Error"); return; }
        const r2 = await approveBill(r1.id);
        if ("error" in r2) { setError(r2.error ?? "Error"); return; }
        router.push(`/africs/accounting/bills/${r1.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSaveDraft} className="space-y-6 max-w-2xl">
      {/* Vendor */}
      <div className="space-y-2">
        <Label>Vendor <span className="text-destructive">*</span></Label>
        <Select value={vendorId} onValueChange={onVendorChange} required>
          <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
          <SelectContent>
            {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Category (optional) */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Select expense category"
          />
        </div>
      )}

      {/* Title + Reference */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Bill Title <span className="text-destructive">*</span></Label>
          <Input id="title" name="title" required defaultValue={bill?.title} placeholder="e.g. Office Supplies — March" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Vendor Invoice # <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input id="referenceNumber" name="referenceNumber" defaultValue={bill?.referenceNumber ?? ""} placeholder="Vendor's invoice number" />
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subtotal">Subtotal <span className="text-destructive">*</span></Label>
          <Input id="subtotal" name="subtotal" type="number" min="0.01" step="0.01" required value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input id="taxRate" name="taxRate" type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Live total preview */}
      {parseFloat(subtotal) > 0 && (
        <div className="flex justify-end gap-6 text-sm p-3 bg-muted rounded-lg">
          {taxAmount > 0 && <span className="text-muted-foreground">Tax: <span className="font-mono font-medium">{taxAmount.toFixed(2)}</span></span>}
          <span className="font-semibold">Total: <span className="font-mono">{total.toFixed(2)} {currency}</span></span>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input id="issueDate" name="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
          <Input id="dueDate" name="dueDate" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      {/* Early payment discount terms */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentTermsDays">Net Days</Label>
          <Input id="paymentTermsDays" name="paymentTermsDays" type="number" min="0" placeholder="e.g. 30" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Discount %</Label>
          <Input id="discountPercent" name="discountPercent" type="number" min="0" step="0.01" placeholder="e.g. 2" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountDays">Discount Window (days)</Label>
          <Input id="discountDays" name="discountDays" type="number" min="0" placeholder="e.g. 10" value={discountDays} onChange={(e) => setDiscountDays(e.target.value)} />
        </div>
      </div>
      {parseFloat(discountPercent) > 0 && parseFloat(subtotal) > 0 && (
        <p className="text-xs text-emerald-500">
          {discountPercent}% discount = {((parseFloat(discountPercent) / 100) * total).toFixed(2)} {currency} if paid within {discountDays || "?"} days
        </p>
      )}

      {/* Description + Notes */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={bill?.description ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={bill?.notes ?? ""} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Saving…" : "Save as Draft"}
        </Button>
        <Button type="button" disabled={isPending} onClick={handleSaveAndApprove}>
          {isPending ? "Saving…" : "Save & Approve"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
      </div>
    </form>
  );
}
