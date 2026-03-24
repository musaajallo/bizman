import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getExpenseCategories } from "@/lib/actions/expenses";
import { getEmployees } from "@/lib/actions/employees";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function NewExpensePage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [categories, employees] = await Promise.all([
    getExpenseCategories(),
    getEmployees(owner.id, { status: "active" }),
  ]);

  const employeesForForm = employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    employeeNumber: e.employeeNumber,
  }));

  return (
    <div>
      <TopBar
        title="New Expense"
        subtitle="Submit a new expense claim"
        actions={
          <Link href="/africs/accounting/expenses">
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
            <ExpenseForm categories={categories} employees={employeesForForm} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
