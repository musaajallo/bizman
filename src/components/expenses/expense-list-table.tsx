"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { ExpenseCategoryBadge } from "./expense-category-badge";

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  expenseDate: string;
  category: { name: string; code: string | null } | null;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string } | null;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ExpenseListTable({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();

  if (expenses.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground text-sm">No expenses found.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Title</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Employee</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/africs/accounting/expenses/${e.id}`)}
              >
                <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  {fmtDate(e.expenseDate)}
                </td>
                <td className="py-3 px-4 font-medium">{e.title}</td>
                <td className="py-3 px-4 hidden md:table-cell">
                  {e.category ? <ExpenseCategoryBadge label={e.category.name} /> : <span className="text-muted-foreground/50 text-xs">—</span>}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                  {e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm font-semibold">
                  {fmt(e.amount, e.currency)}
                </td>
                <td className="py-3 px-4">
                  <ExpenseStatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
