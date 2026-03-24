export const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals & Dining" },
  { value: "accommodation", label: "Accommodation" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "training", label: "Training & Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "medical", label: "Medical" },
  { value: "communication", label: "Communication" },
  { value: "other", label: "Other" },
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number]["value"];

export const EXPENSE_STATUSES = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "reimbursed", label: "Reimbursed" },
] as const;

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "reimbursed";
