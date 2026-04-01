import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getBill } from "@/lib/actions/bills";
import { getVendors } from "@/lib/actions/vendors";
import { getExpenseCategories } from "@/lib/actions/expenses";
import { BillForm } from "@/components/bills/bill-form";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bill, vendors, categories] = await Promise.all([
    getBill(id),
    getVendors({ status: "active" }),
    getExpenseCategories(),
  ]);
  if (!bill || bill.status !== "draft") notFound();

  return (
    <div>
      <TopBar
        title="Edit Bill"
        subtitle={bill.billNumber}
        actions={
          <Link href={`/africs/accounting/bills/${id}`}>
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card><CardContent className="pt-6"><BillForm vendors={vendors} bill={bill} categories={categories} /></CardContent></Card>
      </div>
    </div>
  );
}
