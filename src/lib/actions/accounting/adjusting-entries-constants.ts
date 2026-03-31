export type AdjustmentType =
  | "accrued_expense"
  | "accrued_revenue"
  | "deferred_expense"
  | "deferred_revenue";

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  accrued_expense:   "Accrued Expense",
  accrued_revenue:   "Accrued Revenue",
  deferred_expense:  "Deferred Expense (Prepaid)",
  deferred_revenue:  "Deferred Revenue",
};
