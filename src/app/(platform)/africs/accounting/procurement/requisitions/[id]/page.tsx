import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getRequisition } from "@/lib/actions/procurement";
import { RequisitionDetailCard } from "@/components/procurement/requisition-detail-card";
import { RequisitionActions } from "@/components/procurement/requisition-actions";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requisition = await getRequisition(id);
  if (!requisition) notFound();

  return (
    <div>
      <TopBar
        title={requisition.requisitionNumber}
        subtitle={requisition.title}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/procurement?tab=requisitions">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
            <RequisitionActions requisitionId={requisition.id} status={requisition.status} />
          </div>
        }
      />
      <div className="p-6 max-w-4xl">
        <RequisitionDetailCard requisition={requisition} />
      </div>
    </div>
  );
}
