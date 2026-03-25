import { getAppraisalCycleById } from "@/lib/actions/appraisals";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { AppraisalCycleForm } from "@/components/appraisals/appraisal-cycle-form";

export default async function EditAppraisalCyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await getAppraisalCycleById(id);
  if (!cycle) notFound();
  if (cycle.status !== "draft") notFound(); // only draft cycles can be edited

  return (
    <div>
      <TopBar title="Edit Cycle" subtitle={cycle.name} />
      <div className="p-6">
        <AppraisalCycleForm cycle={cycle} />
      </div>
    </div>
  );
}
