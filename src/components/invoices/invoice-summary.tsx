interface Props {
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  discountPercent?: number | null;
  discountAmount: number;
  rushFeePercent?: number | null;
  rushFee?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function InvoiceSummary({ subtotal, taxRate, taxAmount, discountPercent, discountAmount, rushFeePercent, rushFee = 0, total, amountPaid, amountDue, currency }: Props) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal, currency)}</span>
      </div>
      {rushFee > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Rush Fee{rushFeePercent ? ` (${rushFeePercent}%)` : ""}
          </span>
          <span className="text-amber-400">+{formatCurrency(rushFee, currency)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Discount{discountPercent ? ` (${discountPercent}%)` : ""}
          </span>
          <span className="text-emerald-400">-{formatCurrency(discountAmount, currency)}</span>
        </div>
      )}
      {taxRate !== null && taxRate > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax ({taxRate}%)</span>
          <span>{formatCurrency(taxAmount, currency)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-2 font-semibold">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
      {amountPaid > 0 && (
        <>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid</span>
            <span className="text-emerald-400">-{formatCurrency(amountPaid, currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Balance Due</span>
            <span className={amountDue > 0 ? "text-red-400" : "text-emerald-400"}>
              {formatCurrency(amountDue, currency)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
