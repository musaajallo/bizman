import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getVendors } from "@/lib/actions/vendors";
import { VENDOR_STATUSES } from "@/lib/bill-constants";
import { VendorListTable } from "@/components/vendors/vendor-list-table";
import { Plus } from "lucide-react";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const vendors = await getVendors({ status });

  return (
    <div>
      <TopBar
        title="Vendors"
        subtitle="Supplier and vendor management"
        actions={
          <Link href="/africs/accounting/vendors/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Vendor
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-1 border-b border-border pb-0">
          {VENDOR_STATUSES.map((s) => {
            const isActive = (status ?? "") === s.value;
            const href = s.value ? `/africs/accounting/vendors?status=${s.value}` : "/africs/accounting/vendors";
            return (
              <Link
                key={s.value}
                href={href}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <VendorListTable vendors={vendors} />
      </div>
    </div>
  );
}
