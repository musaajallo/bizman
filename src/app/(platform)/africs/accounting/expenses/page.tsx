import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getExpenses, getExpenseStats } from "@/lib/actions/expenses";
import { EXPENSE_STATUSES } from "@/lib/expense-constants";
import { ExpenseStatsCards } from "@/components/expenses/expense-stats-cards";
import { ExpenseListTable } from "@/components/expenses/expense-list-table";
import { Plus } from "lucide-react";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [expenses, stats] = await Promise.all([
    getExpenses({ status }),
    getExpenseStats(),
  ]);

  const currency = expenses[0]?.currency ?? "GMD";

  return (
    <div>
      <TopBar
        title="Expenses"
        subtitle="Expense claims and reimbursements"
        actions={
          <Link href="/africs/accounting/expenses/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Expense
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-1 border-b border-border pb-0 flex-wrap">
          {EXPENSE_STATUSES.map((s) => {
            const isActive = (status ?? "") === s.value;
            const href = s.value
              ? `/africs/accounting/expenses?status=${s.value}`
              : "/africs/accounting/expenses";
            return (
              <Link
                key={s.value}
                href={href}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <ExpenseStatsCards stats={stats} currency={currency} />
        <ExpenseListTable expenses={expenses} />
      </div>
    </div>
  );
}
