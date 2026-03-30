import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getBudgets } from "@/lib/actions/budgets";
import { BudgetsTable } from "@/components/budgets/budgets-table";
import { Plus } from "lucide-react";

export default async function BudgetsPage() {
  const budgets = await getBudgets();

  return (
    <div>
      <TopBar
        title="Budgets"
        subtitle="Plan and track spend across departments and categories"
        actions={
          <Link href="/africs/accounting/budgets/new">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Budget</Button>
          </Link>
        }
      />
      <div className="p-6">
        <div className="rounded-md border overflow-hidden">
          <BudgetsTable budgets={budgets} />
        </div>
      </div>
    </div>
  );
}
