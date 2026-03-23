"use client";

import { Button } from "@/components/ui/button";
import { Trash2, CreditCard } from "lucide-react";
import { deletePayment } from "@/lib/actions/invoices";

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  notes: string | null;
  date: Date | string;
  recordedBy: { id: string; name: string | null };
}

interface Props {
  payments: Payment[];
  currency: string;
  onUpdated?: () => void;
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  check: "Check",
  card: "Card",
  mobile_money: "Mobile Money",
  other: "Other",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PaymentHistory({ payments, currency, onUpdated }: Props) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <CreditCard className="h-5 w-5 mx-auto mb-2 opacity-50" />
        No payments recorded yet
      </div>
    );
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Delete this payment record?")) return;
    await deletePayment(paymentId);
    onUpdated?.();
  };

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-start gap-3 p-3 rounded-lg border text-sm group">
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{formatCurrency(payment.amount, currency)}</span>
              <span className="text-xs text-muted-foreground">{formatDate(payment.date)}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {payment.method && (
                <span className="text-xs text-muted-foreground">
                  {methodLabels[payment.method] || payment.method}
                </span>
              )}
              {payment.reference && (
                <span className="text-xs text-muted-foreground font-mono">
                  Ref: {payment.reference}
                </span>
              )}
            </div>
            {payment.notes && (
              <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Recorded by {payment.recordedBy.name ?? "Unknown"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={() => handleDelete(payment.id)}
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </Button>
        </div>
      ))}
    </div>
  );
}
