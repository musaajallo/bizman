import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getExpense, getExpenseCategories } from "@/lib/actions/expenses";
import { getEmployees } from "@/lib/actions/employees";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [expense, categories, employees] = await Promise.all([
    getExpense(id),
    getExpenseCategories(),
    getEmployees(owner.id, { status: "active" }),
  ]);

  if (!expense) notFound();
  if (expense.status !== "draft") notFound();

  const employeesForForm = employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    employeeNumber: e.employeeNumber,
  }));

  const expenseForForm = {
    id: expense.id,
    title: expense.title,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    categoryId: expense.categoryId,
    expenseDate: expense.expenseDate,
    employeeId: expense.employeeId,
    receiptUrl: expense.receiptUrl,
  };

  return (
    <div>
      <TopBar
        title="Edit Expense"
        subtitle={expense.title}
        actions={
          <Link href={`/africs/accounting/expenses/${id}`}>
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <ExpenseForm categories={categories} employees={employeesForForm} expense={expenseForForm} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
