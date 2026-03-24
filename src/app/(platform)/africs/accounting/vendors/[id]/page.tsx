import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getVendor } from "@/lib/actions/vendors";
import { getBillsForVendor } from "@/lib/actions/bills";
import { VendorDetailCard } from "@/components/vendors/vendor-detail-card";
import { BillListTable } from "@/components/bills/bill-list-table";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vendor, bills] = await Promise.all([getVendor(id), getBillsForVendor(id)]);
  if (!vendor) notFound();

  return (
    <div>
      <TopBar
        title={vendor.name}
        subtitle={vendor.contactName ?? "Vendor"}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/vendors">
              <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <Link href={`/africs/accounting/vendors/${id}/edit`}>
              <Button size="sm" variant="outline" className="gap-2"><Pencil className="h-3.5 w-3.5" />Edit</Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <VendorDetailCard vendor={vendor} />
        {bills.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bills</p>
            <BillListTable bills={bills} />
          </div>
        )}
      </div>
    </div>
  );
}
