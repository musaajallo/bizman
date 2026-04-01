"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpense, updateExpense, submitExpense } from "@/lib/actions/expenses";
import { CategoryPicker } from "@/components/shared/category-picker";

interface Category {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface ExistingExpense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  categoryId: string | null;
  expenseDate: string;
  employeeId: string | null;
  receiptUrl: string | null;
}

interface Props {
  categories: Category[];
  employees: Employee[];
  expense?: ExistingExpense;
}

const CURRENCIES = [
  "GMD", "USD", "EUR", "GBP", "ZAR", "KES", "NGN", "GHS", "BWP",
];

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function ExpenseForm({ categories, employees, expense }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(expense?.currency ?? "GMD");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [employeeId, setEmployeeId] = useState(expense?.employeeId ?? "");

  function onCurrencyChange(v: string | null) { if (v) setCurrency(v); }
  function onCategoryChange(v: string | null) { if (v) setCategoryId(v); }
  function onEmployeeChange(v: string | null) { setEmployeeId(v ?? ""); }

  const isEdit = !!expense;

  function buildFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("currency", currency);
    fd.set("categoryId", categoryId);
    if (employeeId) fd.set("employeeId", employeeId);
    return fd;
  }

  function handleSaveDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = buildFormData(e.currentTarget);
    startTransition(async () => {
      if (isEdit) {
        const result = await updateExpense(expense.id, fd);
        if ("error" in result) { setError(result.error ?? "Error"); return; }
        router.push(`/africs/accounting/expenses/${expense.id}`);
      } else {
        const result = await createExpense(fd);
        if ("error" in result) { setError(result.error ?? "Error"); return; }
        router.push(`/africs/accounting/expenses/${result.id}`);
      }
    });
  }

  function handleSaveAndSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setError(null);
    const form = (e.currentTarget.closest("form") as HTMLFormElement);
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = buildFormData(form);
    startTransition(async () => {
      if (isEdit) {
        const r1 = await updateExpense(expense.id, fd);
        if ("error" in r1) { setError(r1.error ?? "Error"); return; }
        const r2 = await submitExpense(expense.id);
        if ("error" in r2) { setError(r2.error ?? "Error"); return; }
        router.push(`/africs/accounting/expenses/${expense.id}`);
      } else {
        const r1 = await createExpense(fd);
        if ("error" in r1) { setError(r1.error ?? "Error"); return; }
        const r2 = await submitExpense(r1.id);
        if ("error" in r2) { setError(r2.error ?? "Error"); return; }
        router.push(`/africs/accounting/expenses/${r1.id}`);
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSaveDraft} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Flight to Nairobi"
          defaultValue={expense?.title}
        />
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
            defaultValue={expense?.amount}
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category <span className="text-destructive">*</span></Label>
          <CategoryPicker
            categories={categories}
            value={categoryId || null}
            onChange={(v) => setCategoryId(v ?? "")}
            placeholder="Select category"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Date <span className="text-destructive">*</span></Label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            defaultValue={expense ? toDateInput(expense.expenseDate) : today}
            max={today}
          />
        </div>
      </div>

      {/* Employee (optional) */}
      {employees.length > 0 && (
        <div className="space-y-2">
          <Label>Employee <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Select value={employeeId} onValueChange={onEmployeeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Link to an employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— None —</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{e.employeeNumber}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Additional details about this expense…"
          rows={3}
          defaultValue={expense?.description ?? ""}
        />
      </div>

      {/* Receipt URL */}
      <div className="space-y-2">
        <Label htmlFor="receiptUrl">Receipt URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Input
          id="receiptUrl"
          name="receiptUrl"
          type="url"
          placeholder="https://…"
          defaultValue={expense?.receiptUrl ?? ""}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Saving…" : "Save as Draft"}
        </Button>
        <Button type="button" disabled={isPending} onClick={handleSaveAndSubmit}>
          {isPending ? "Saving…" : "Save & Submit"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
