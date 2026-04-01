export const PAYMENT_TERMS = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net15",          label: "Net 15" },
  { value: "net30",          label: "Net 30" },
  { value: "net60",          label: "Net 60" },
  { value: "1/10_net30",     label: "1/10 Net 30" },
  { value: "2/10_net30",     label: "2/10 Net 30" },
  { value: "2/10_net60",     label: "2/10 Net 60" },
] as const;

export type PaymentTermsValue = (typeof PAYMENT_TERMS)[number]["value"];

type ParsedTerms = { netDays: number; discountPercent?: number; discountDays?: number };

const TERMS_CONFIG: Record<string, ParsedTerms> = {
  due_on_receipt: { netDays: 0 },
  net15:          { netDays: 15 },
  net30:          { netDays: 30 },
  net60:          { netDays: 60 },
  "1/10_net30":   { netDays: 30, discountPercent: 1, discountDays: 10 },
  "2/10_net30":   { netDays: 30, discountPercent: 2, discountDays: 10 },
  "2/10_net60":   { netDays: 60, discountPercent: 2, discountDays: 10 },
};

export function parsePaymentTerms(code: string): ParsedTerms {
  return TERMS_CONFIG[code] ?? { netDays: 30 };
}

export const BILL_PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "other", label: "Other" },
] as const;

export type BillPaymentMethod = (typeof BILL_PAYMENT_METHODS)[number]["value"];

export const BILL_STATUSES = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "partially_paid", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void", label: "Void" },
] as const;

export type BillStatus = "draft" | "approved" | "partially_paid" | "paid" | "overdue" | "void";

export const VENDOR_STATUSES = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
