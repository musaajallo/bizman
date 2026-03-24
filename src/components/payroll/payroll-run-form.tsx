"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPayrollRun } from "@/lib/actions/payroll";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "BWP", label: "BWP — Botswana Pula" },
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
  { value: "UGX", label: "UGX — Ugandan Shilling" },
  { value: "ZMW", label: "ZMW — Zambian Kwacha" },
  { value: "MWK", label: "MWK — Malawian Kwacha" },
  { value: "RWF", label: "RWF — Rwandan Franc" },
  { value: "ETB", label: "ETB — Ethiopian Birr" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

export function PayrollRunForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPayrollRun(fd);
      if ("error" in result) {
        setError(result.error ?? "An error occurred");
      } else {
        router.push(`/africs/accounting/payroll/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="periodMonth">Month</Label>
          <select
            id="periodMonth"
            name="periodMonth"
            defaultValue={defaultMonth}
            required
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodYear">Year</Label>
          <select
            id="periodYear"
            name="periodYear"
            defaultValue={defaultYear}
            required
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          name="currency"
          defaultValue="USD"
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Any notes about this payroll run…" />
      </div>

      <p className="text-xs text-muted-foreground">
        Payslips will be auto-generated for all active and on-leave employees using their current compensation details.
        You can adjust individual payslips before processing.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Generating payslips…" : "Create Payroll Run"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
