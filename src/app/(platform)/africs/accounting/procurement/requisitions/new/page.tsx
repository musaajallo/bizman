import { TopBar } from "@/components/layout/top-bar";
import { RequisitionForm } from "@/components/procurement/requisition-form";

export default function NewRequisitionPage() {
  return (
    <div>
      <TopBar title="New Requisition" subtitle="Create a purchase requisition" />
      <div className="p-6 max-w-3xl">
        <RequisitionForm />
      </div>
    </div>
  );
}
