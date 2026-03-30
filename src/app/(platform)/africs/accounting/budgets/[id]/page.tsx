import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBudgetById } from "@/lib/actions/budgets";
import { BudgetDetailClient } from "@/components/budgets/budget-detail-client";

export default async function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const budget = await getBudgetById(id);
  if (!budget) notFound();

  return (
    <div>
      <TopBar
        title={budget.name}
        subtitle="Budget details and variance view"
        actions={
          <Link href="/africs/accounting/budgets">
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <BudgetDetailClient budget={budget} />
      </div>
    </div>
  );
}
