import { TopBar } from "@/components/layout/top-bar";
import { getRequisition } from "@/lib/actions/procurement";
import { RequisitionForm } from "@/components/procurement/requisition-form";
import { notFound } from "next/navigation";

export default async function EditRequisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requisition = await getRequisition(id);
  if (!requisition) notFound();
  if (requisition.status !== "draft") notFound();

  return (
    <div>
      <TopBar title="Edit Requisition" subtitle={requisition.requisitionNumber} />
      <div className="p-6 max-w-3xl">
        <RequisitionForm requisition={requisition} />
      </div>
    </div>
  );
}
