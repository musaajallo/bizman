import { Card } from "@/components/ui/card";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { ExpenseCategoryBadge } from "./expense-category-badge";
import { ExternalLink } from "lucide-react";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  expenseDate: string;
  receiptUrl: string | null;
  notes: string | null;
  reviewedAt: string | null;
  reimbursedAt: string | null;
  category: { value: string; label: string };
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string; department: string | null; jobTitle: string | null } | null;
  submittedBy: { id: string; name: string | null; email: string };
  reviewedBy: { id: string; name: string | null; email: string } | null;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function ExpenseDetailCard({ expense }: { expense: Expense }) {
  return (
    <div className="space-y-4">
      {/* Main card */}
      <Card className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{expense.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <ExpenseCategoryBadge label={expense.category.label} />
              <ExpenseStatusBadge status={expense.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-foreground">{fmt(expense.amount, expense.currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmtDate(expense.expenseDate)}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <Field label="Submitted By">
            {expense.submittedBy.name || expense.submittedBy.email}
          </Field>
          <Field label="Expense Date">
            {fmtDate(expense.expenseDate)}
          </Field>
          <Field label="Currency">
            {expense.currency}
          </Field>
          {expense.employee && (
            <Field label="Employee">
              <p>{expense.employee.firstName} {expense.employee.lastName}</p>
              <p className="text-xs text-muted-foreground font-mono">{expense.employee.employeeNumber}</p>
              {expense.employee.jobTitle && <p className="text-xs text-muted-foreground">{expense.employee.jobTitle}</p>}
            </Field>
          )}
          {expense.receiptUrl && (
            <Field label="Receipt">
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                View Receipt <ExternalLink className="h-3 w-3" />
              </a>
            </Field>
          )}
        </div>

        {expense.description && (
          <>
            <div className="border-t border-border" />
            <Field label="Description">
              <p className="text-muted-foreground whitespace-pre-wrap">{expense.description}</p>
            </Field>
          </>
        )}
      </Card>

      {/* Review / rejection notes */}
      {(expense.reviewedBy || expense.notes) && (
        <Card className="p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {expense.reviewedBy && (
              <Field label="Reviewed By">
                {expense.reviewedBy.name || expense.reviewedBy.email}
              </Field>
            )}
            {expense.reviewedAt && (
              <Field label="Review Date">
                {fmtDate(expense.reviewedAt)}
              </Field>
            )}
            {expense.reimbursedAt && (
              <Field label="Reimbursed On">
                {fmtDate(expense.reimbursedAt)}
              </Field>
            )}
          </div>
          {expense.notes && (
            <Field label={expense.status === "rejected" ? "Rejection Reason" : "Notes"}>
              <p className={`whitespace-pre-wrap ${expense.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>
                {expense.notes}
              </p>
            </Field>
          )}
        </Card>
      )}
    </div>
  );
}
