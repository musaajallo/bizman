import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getAPAgingReport } from "@/lib/actions/bills";
import { APAgingTable } from "@/components/bills/ap-aging-table";
import { ArrowLeft } from "lucide-react";

export default async function APAgingPage() {
  const report = await getAPAgingReport();

  return (
    <div>
      <TopBar
        title="AP Aging Report"
        subtitle="Outstanding bills by aging bucket"
        actions={
          <Link href="/africs/accounting/bills">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Bills
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <APAgingTable report={report} />
      </div>
    </div>
  );
}
