import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getExpense } from "@/lib/actions/expenses";
import { ExpenseDetailCard } from "@/components/expenses/expense-detail-card";
import { ExpenseActions } from "@/components/expenses/expense-actions";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpense(id);
  if (!expense) notFound();

  return (
    <div>
      <TopBar
        title={expense.title}
        subtitle={`${expense.category?.name ?? "Uncategorised"} · ${fmtDate(expense.expenseDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/expenses">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <ExpenseActions expenseId={expense.id} status={expense.status} />
          </div>
        }
      />
      <div className="p-6">
        <ExpenseDetailCard expense={expense} />
      </div>
    </div>
  );
}
