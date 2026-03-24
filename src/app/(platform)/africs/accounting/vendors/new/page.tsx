import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { VendorForm } from "@/components/vendors/vendor-form";
import { ArrowLeft } from "lucide-react";

export default function NewVendorPage() {
  return (
    <div>
      <TopBar
        title="New Vendor"
        subtitle="Add a supplier or vendor"
        actions={
          <Link href="/africs/accounting/vendors">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card><CardContent className="pt-6"><VendorForm /></CardContent></Card>
      </div>
    </div>
  );
}
