import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { BillForm } from "@/components/bills/bill-form";
import { getVendors } from "@/lib/actions/vendors";
import { ArrowLeft } from "lucide-react";

export default async function NewBillPage() {
  const vendors = await getVendors({ status: "active" });

  return (
    <div>
      <TopBar
        title="New Bill"
        subtitle="Record a supplier invoice"
        actions={
          <Link href="/africs/accounting/bills">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card><CardContent className="pt-6"><BillForm vendors={vendors} /></CardContent></Card>
      </div>
    </div>
  );
}
