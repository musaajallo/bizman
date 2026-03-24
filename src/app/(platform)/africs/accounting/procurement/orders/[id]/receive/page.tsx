import { TopBar } from "@/components/layout/top-bar";
import { getPurchaseOrder } from "@/lib/actions/procurement";
import { GoodsReceiptForm } from "@/components/procurement/goods-receipt-form";
import { notFound } from "next/navigation";

export default async function ReceiveGoodsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) notFound();
  if (!["sent", "partially_received"].includes(order.status)) notFound();

  return (
    <div>
      <TopBar title="Receive Goods" subtitle={`${order.poNumber} — ${order.vendor.name}`} />
      <div className="p-6 max-w-3xl">
        <GoodsReceiptForm orderId={order.id} orderTitle={order.title} items={order.items} />
      </div>
    </div>
  );
}
