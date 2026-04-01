import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getBill } from "@/lib/actions/bills";
import { BillDetailCard } from "@/components/bills/bill-detail-card";
import { BillActions } from "@/components/bills/bill-actions";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  return (
    <div>
      <TopBar
        title={bill.billNumber}
        subtitle={bill.title}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/bills">
              <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <BillActions
              billId={bill.id}
              status={bill.status}
              amountDue={bill.amountDue}
              currency={bill.currency}
              issueDate={bill.issueDate}
              discountPercent={bill.discountPercent}
              discountDays={bill.discountDays}
              discountCaptured={bill.discountCaptured}
            />
          </div>
        }
      />
      <div className="p-6">
        <BillDetailCard bill={bill} />
      </div>
    </div>
  );
}
