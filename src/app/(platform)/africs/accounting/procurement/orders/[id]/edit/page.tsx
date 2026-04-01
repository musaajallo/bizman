import { TopBar } from "@/components/layout/top-bar";
import { getPurchaseOrder } from "@/lib/actions/procurement";
import { PoForm } from "@/components/procurement/po-form";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getExpenseCategories } from "@/lib/actions/expenses";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, owner, categories] = await Promise.all([
    getPurchaseOrder(id),
    getOwnerBusiness(),
    getExpenseCategories(),
  ]);
  if (!order) notFound();
  if (order.status !== "draft") notFound();

  const vendors = owner
    ? await prisma.vendor.findMany({
        where: { tenantId: owner.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <TopBar title="Edit Purchase Order" subtitle={order.poNumber} />
      <div className="p-6 max-w-3xl">
        <PoForm vendors={vendors} order={order} categories={categories} />
      </div>
    </div>
  );
}
