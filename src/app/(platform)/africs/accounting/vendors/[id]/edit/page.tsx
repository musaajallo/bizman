import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getVendor } from "@/lib/actions/vendors";
import { VendorForm } from "@/components/vendors/vendor-form";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await getVendor(id);
  if (!vendor) notFound();

  return (
    <div>
      <TopBar
        title="Edit Vendor"
        subtitle={vendor.name}
        actions={
          <Link href={`/africs/accounting/vendors/${id}`}>
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <Card><CardContent className="pt-6"><VendorForm vendor={vendor} /></CardContent></Card>
      </div>
    </div>
  );
}
