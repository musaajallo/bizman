"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRequisition, updateRequisition } from "@/lib/actions/procurement";
import { REQUISITION_PRIORITIES, UNITS } from "@/lib/procurement-constants";
import { Plus, Trash2 } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  estimatedUnitCost: string;
  notes: string;
}

interface Props {
  requisition?: {
    id: string;
    title: string;
    description: string | null;
    department: string | null;
    priority: string;
    requiredByDate: string | null;
    notes: string | null;
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unit: string | null;
      estimatedUnitPrice: number;
    }>;
  };
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: "1", unit: "pcs", estimatedUnitCost: "", notes: "" };
}

export function RequisitionForm({ requisition }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>(
    requisition?.items.length
      ? requisition.items.map((i) => ({
          id: i.id,
          description: i.description,
          quantity: String(i.quantity),
          unit: i.unit ?? "pcs",
          estimatedUnitCost: i.estimatedUnitPrice ? String(i.estimatedUnitPrice) : "",
          notes: "",
        }))
      : [newItem()]
  );

  function updateItem(id: string, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function removeItem(id: string) {
    if (items.length > 1) setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items.map((it) => ({
      description: it.description,
      quantity: parseFloat(it.quantity) || 1,
      unit: it.unit || undefined,
      estimatedUnitPrice: it.estimatedUnitCost ? parseFloat(it.estimatedUnitCost) : undefined,
    }))));

    startTransition(async () => {
      const result = requisition
        ? await updateRequisition(requisition.id, fd)
        : await createRequisition(fd);

      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      if (result && "id" in result) {
        router.push(`/africs/accounting/procurement/requisitions/${String((result as { id: string }).id)}`);
      } else {
        router.push(`/africs/accounting/procurement/requisitions/${requisition!.id}`);
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
              <Input id="title" name="title" defaultValue={requisition?.title} required placeholder="What are you requesting?" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" defaultValue={requisition?.department ?? ""} placeholder="e.g. Operations" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={requisition?.priority ?? "normal"}>
                <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REQUISITION_PRIORITIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requiredByDate">Required By Date</Label>
              <Input
                id="requiredByDate"
                name="requiredByDate"
                type="date"
                defaultValue={requisition?.requiredByDate ? requisition.requiredByDate.substring(0, 10) : ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={requisition?.description ?? ""} rows={2} placeholder="Optional description" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={requisition?.notes ?? ""} rows={2} placeholder="Internal notes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Items</CardTitle>
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => setItems((p) => [...p, newItem()])}>
            <Plus className="h-3.5 w-3.5" />Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
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
                <Label className="text-xs">Est. Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={item.estimatedUnitCost}
                  onChange={(e) => updateItem(item.id, "estimatedUnitCost", e.target.value)}
                  placeholder="0.00"
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
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : requisition ? "Save Changes" : "Create Requisition"}
        </Button>
      </div>
    </form>
  );
}
