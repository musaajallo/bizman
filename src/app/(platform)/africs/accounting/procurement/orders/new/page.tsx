import { TopBar } from "@/components/layout/top-bar";
import { PoForm } from "@/components/procurement/po-form";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getExpenseCategories } from "@/lib/actions/expenses";
import { prisma } from "@/lib/prisma";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ requisitionId?: string }>;
}) {
  const { requisitionId } = await searchParams;
  const owner = await getOwnerBusiness();
  const [vendors, categories] = await Promise.all([
    owner
      ? prisma.vendor.findMany({
          where: { tenantId: owner.id },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    getExpenseCategories(),
  ]);

  return (
    <div>
      <TopBar title="New Purchase Order" subtitle="Create a purchase order for a vendor" />
      <div className="p-6 max-w-3xl">
        <PoForm vendors={vendors} requisitionId={requisitionId} categories={categories} />
      </div>
    </div>
  );
}
