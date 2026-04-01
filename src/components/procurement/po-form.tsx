"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/procurement";
import { UNITS } from "@/lib/procurement-constants";
import { Plus, Trash2 } from "lucide-react";
import { CategoryPicker } from "@/components/shared/category-picker";

interface Vendor { id: string; name: string }
interface FlatCategory { id: string; name: string; code: string | null; parentId: string | null; }

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
  notes: string;
  categoryId: string | null;
}

interface Props {
  vendors: Vendor[];
  requisitionId?: string;
  categories?: FlatCategory[];
  order?: {
    id: string;
    title: string;
    description: string | null;
    vendorId: string;
    currency: string;
    taxRate: number;
    expectedDelivery: string | null;
    notes: string | null;
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unit: string | null;
      unitPrice: number;
    }>;
  };
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: "1", unit: "pcs", unitCost: "", notes: "", categoryId: null };
}

export function PoForm({ vendors, requisitionId, order, categories = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>(
    order?.items.length
      ? order.items.map((i) => ({
          id: i.id,
          description: i.description,
          quantity: String(i.quantity),
          unit: i.unit ?? "pcs",
          unitCost: String(i.unitPrice),
          notes: "",
          categoryId: null,
        }))
      : [newItem()]
  );
  const [taxRate, setTaxRate] = useState(order?.taxRate ?? 0);
  const [currency, setCurrency] = useState(order?.currency ?? "GMD");

  function updateItem(id: string, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function removeItem(id: string) {
    if (items.length > 1) setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitCost) || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items.map((it) => ({
      description: it.description,
      quantity: parseFloat(it.quantity) || 1,
      unit: it.unit || undefined,
      unitPrice: parseFloat(it.unitCost) || 0,
      categoryId: it.categoryId || null,
    }))));
    if (requisitionId) fd.set("requisitionId", requisitionId);

    startTransition(async () => {
      const result = order
        ? await updatePurchaseOrder(order.id, fd)
        : await createPurchaseOrder(fd);

      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      if (result && "id" in result) {
        router.push(`/africs/accounting/procurement/orders/${String((result as { id: string }).id)}`);
      } else {
        router.push(`/africs/accounting/procurement/orders/${order!.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" defaultValue={order?.title} required placeholder="Purchase order title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendorId">Vendor *</Label>
              <Select name="vendorId" defaultValue={order?.vendorId} required>
                <SelectTrigger id="vendorId"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                min="0"
                max="100"
                step="any"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedDelivery">Expected Delivery</Label>
              <Input
                id="expectedDelivery"
                name="expectedDelivery"
                type="date"
                defaultValue={order?.expectedDelivery ? order.expectedDelivery.substring(0, 10) : ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={order?.description ?? ""} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes for Vendor</Label>
            <Textarea id="notes" name="notes" defaultValue={order?.notes ?? ""} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => setItems((p) => [...p, newItem()])}>
            <Plus className="h-3.5 w-3.5" />Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-md bg-muted/20">
              <div className="col-span-12 sm:col-span-5 space-y-1">
                <Label className="text-xs">Description *</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Item description"
                  required
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs">Qty *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                  required
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs">Unit</Label>
                <Select value={item.unit ?? "pcs"} onValueChange={(v) => updateItem(item.id, "unit", v ?? "pcs")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 sm:col-span-2 space-y-1">
                <Label className="text-xs">Unit Cost *</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={item.unitCost}
                  onChange={(e) => updateItem(item.id, "unitCost", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="col-span-1 flex items-end justify-end pb-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {categories.length > 0 && (
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs">Category</Label>
                  <CategoryPicker
                    categories={categories}
                    value={item.categoryId}
                    onChange={(v) => setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, categoryId: v } : it))}
                    placeholder="Select category (optional)"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-col items-end gap-1 pt-2 text-sm">
            <div className="flex gap-8">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-8">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="tabular-nums">{currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-8 font-semibold border-t border-border pt-1 mt-1">
              <span>Total</span>
              <span className="tabular-nums">{currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : order ? "Save Changes" : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
