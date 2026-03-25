import { getAppraisalCycleById } from "@/lib/actions/appraisals";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { CycleDetailCard } from "@/components/appraisals/cycle-detail-card";

export default async function AppraisalCycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await getAppraisalCycleById(id);
  if (!cycle) notFound();

  return (
    <div>
      <TopBar title={cycle.name} subtitle="Appraisal cycle" />
      <div className="p-6">
        <CycleDetailCard cycle={cycle} />
      </div>
    </div>
  );
}
