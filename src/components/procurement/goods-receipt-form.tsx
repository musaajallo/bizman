"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { receiveGoods } from "@/lib/actions/procurement";

interface PoItem {
  id: string;
  description: string;
  quantity: number;
  quantityReceived: number;
  unit: string | null;
}

interface Props {
  orderId: string;
  orderTitle: string;
  items: PoItem[];
}

export function GoodsReceiptForm({ orderId, orderTitle, items }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, String(Math.max(0, i.quantity - i.quantityReceived))]))
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const notes = (fd.get("notes") as string) || undefined;
    const receiptItems = items
      .map((item) => ({
        poItemId: item.id,
        quantityReceived: parseFloat(quantities[item.id] ?? "0") || 0,
      }))
      .filter((i) => i.quantityReceived > 0);

    if (receiptItems.length === 0) {
      setError("Enter at least one quantity to receive");
      return;
    }

    startTransition(async () => {
      const result = await receiveGoods(orderId, receiptItems, notes);
      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.push(`/africs/accounting/procurement/orders/${orderId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receiving for: {orderTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="receivedDate">Received Date *</Label>
            <Input
              id="receivedDate"
              name="receivedDate"
              type="date"
              defaultValue={new Date().toISOString().substring(0, 10)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Any notes about the delivery" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Quantities Received</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2 pr-4">Ordered</th>
                <th className="text-right py-2 pr-4">Already Received</th>
                <th className="text-right py-2">Receiving Now</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const remaining = item.quantity - item.quantityReceived;
                return (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5">
                      {item.description}
                      {item.unit && <span className="text-muted-foreground ml-1 text-xs">({item.unit})</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{item.quantityReceived}</td>
                    <td className="py-2.5">
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        step="any"
                        value={quantities[item.id] ?? "0"}
                        onChange={(e) => setQuantities((p) => ({ ...p, [item.id]: e.target.value }))}
                        className="w-24 ml-auto text-right"
                        disabled={remaining <= 0}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Confirm Receipt"}
        </Button>
      </div>
    </form>
  );
}
