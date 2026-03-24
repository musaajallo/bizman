import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getPurchaseOrder } from "@/lib/actions/procurement";
import { PoDetailCard } from "@/components/procurement/po-detail-card";
import { PoActions } from "@/components/procurement/po-actions";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) notFound();

  return (
    <div>
      <TopBar
        title={order.poNumber}
        subtitle={order.title}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/procurement?tab=orders">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
            <PoActions orderId={order.id} status={order.status} />
          </div>
        }
      />
      <div className="p-6 max-w-4xl">
        <PoDetailCard order={order} />
      </div>
    </div>
  );
}
