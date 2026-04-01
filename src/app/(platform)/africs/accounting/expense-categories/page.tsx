import { TopBar } from "@/components/layout/top-bar";
import {
  getAllExpenseCategories,
  getCategorySpendReport,
} from "@/lib/actions/expense-categories";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/expense-categories/categories-client";

export default async function ExpenseCategoriesPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();
  const tenantId = owner.id;

  const now = new Date();
  const ytdStart = new Date(now.getFullYear(), 0, 1);

  const [tree, spendReport, ledgerAccounts] = await Promise.all([
    getAllExpenseCategories(tenantId),
    getCategorySpendReport(tenantId, ytdStart, now),
    prisma.ledgerAccount.findMany({
      where: { tenantId, type: "Expense", isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <div>
      <TopBar
        title="Expense Categories"
        subtitle="Hierarchical categories with Chart of Accounts mapping"
      />
      <div className="p-6">
        <CategoriesClient
          tenantId={tenantId}
          tree={tree}
          spendReport={spendReport}
          ledgerAccounts={ledgerAccounts}
        />
      </div>
    </div>
  );
}
