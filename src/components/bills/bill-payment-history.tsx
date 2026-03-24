"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteBillPayment } from "@/lib/actions/bills";
import { BILL_PAYMENT_METHODS } from "@/lib/bill-constants";
import { Trash2 } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const methodLabel = (v: string | null) =>
  BILL_PAYMENT_METHODS.find((m) => m.value === v)?.label ?? v ?? "—";

export function BillPaymentHistory({ payments, currency, canDelete }: { payments: Payment[]; currency: string; canDelete: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (payments.length === 0) return null;

  function handleDelete(id: string) {
    setDeleting(id);
    startTransition(async () => {
      await deleteBillPayment(id);
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment History</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Date</th>
            <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Method</th>
            <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Reference</th>
            <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Amount</th>
            {canDelete && <th className="py-2 px-4 w-10" />}
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-border/50">
              <td className="py-2 px-4 text-xs text-muted-foreground">{fmtDate(p.paymentDate)}</td>
              <td className="py-2 px-4 text-xs text-muted-foreground hidden sm:table-cell">{methodLabel(p.paymentMethod)}</td>
              <td className="py-2 px-4 text-xs font-mono text-muted-foreground hidden md:table-cell">{p.reference || "—"}</td>
              <td className="py-2 px-4 text-right font-mono text-sm font-semibold text-emerald-400">{fmt(p.amount, currency)}</td>
              {canDelete && (
                <td className="py-2 px-4">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={isPending && deleting === p.id}
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
