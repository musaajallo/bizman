"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createBenefitType, updateBenefitType } from "@/lib/actions/benefits";

const CURRENCIES = ["USD", "EUR", "GBP", "ZAR", "NGN", "KES", "GHS", "GMD", "UGX"];

interface Existing {
  id: string; name: string; category: string; valueType: string;
  defaultValue: { toString(): string } | number | string | null;
  currency: string; description: string | null; isActive: boolean;
}

export function BenefitTypeForm({ existing }: { existing?: Existing }) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "other");
  const [valueType, setValueType] = useState(existing?.valueType ?? "fixed");
  const [defaultValue, setDefaultValue] = useState(existing?.defaultValue != null ? existing.defaultValue.toString() : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("category", category);
    fd.set("valueType", valueType);
    fd.set("defaultValue", defaultValue);
    fd.set("currency", currency);
    fd.set("description", description);
    fd.set("isActive", String(isActive));
    const result = existing?.id ? await updateBenefitType(existing.id, fd) : await createBenefitType(fd);
    setSaving(false);
    if ("error" in result) { setError(result.error ?? "Failed"); return; }
    router.push("/africs/hr/benefits");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Medical Aid" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v: string | null) => { if (v) setCategory(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["medical","pension","allowance","insurance","loan","other"].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase()+c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value Type</Label>
              <Select value={valueType} onValueChange={(v: string | null) => { if (v) setValueType(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage of Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Default Value <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="number" min="0" step="0.01" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v: string | null) => { if (v) setCurrency(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none h-20" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
            <span className="text-sm">Active</span>
          </label>
        </CardContent>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : existing?.id ? "Update" : "Create"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/africs/hr/benefits")}>Cancel</Button>
      </div>
    </form>
  );
}
