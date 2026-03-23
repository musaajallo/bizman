"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface LineItemData {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit?: string;
}

interface Props {
  items: LineItemData[];
  onChange: (items: LineItemData[]) => void;
  currency: string;
  readOnly?: boolean;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function LineItemEditor({ items, onChange, currency, readOnly }: Props) {
  const updateItem = (index: number, field: keyof LineItemData, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === "description") {
      item.description = value as string;
    } else if (field === "quantity") {
      item.quantity = Number(value) || 0;
      item.amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
    } else if (field === "unitPrice") {
      item.unitPrice = Number(value) || 0;
      item.amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
    } else if (field === "unit") {
      item.unit = value as string;
    }

    updated[index] = item;
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Description</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {/* Items */}
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center">
          <Input
            value={item.description}
            onChange={(e) => updateItem(index, "description", e.target.value)}
            placeholder="Description"
            className="h-8 text-xs"
            readOnly={readOnly}
          />
          <Input
            type="number"
            value={item.quantity || ""}
            onChange={(e) => updateItem(index, "quantity", e.target.value)}
            placeholder="1"
            className="h-8 text-xs"
            min="0"
            step="0.01"
            readOnly={readOnly}
          />
          <Input
            type="number"
            value={item.unitPrice || ""}
            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
            placeholder="0.00"
            className="h-8 text-xs"
            min="0"
            step="0.01"
            readOnly={readOnly}
          />
          <div className="text-xs text-right font-mono pr-1">
            {formatCurrency(item.amount, currency)}
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-3 w-3 text-red-400" />
            </Button>
          )}
        </div>
      ))}

      {/* Add button */}
      {!readOnly && (
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addItem}>
          <Plus className="h-3 w-3" />
          Add Line Item
        </Button>
      )}
    </div>
  );
}
