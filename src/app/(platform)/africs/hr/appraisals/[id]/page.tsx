import { getAppraisalById } from "@/lib/actions/appraisals";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { AppraisalDetailCard } from "@/components/appraisals/appraisal-detail-card";

export default async function AppraisalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appraisal = await getAppraisalById(id);
  if (!appraisal) notFound();

  return (
    <div>
      <TopBar
        title={`${appraisal.employee.firstName} ${appraisal.employee.lastName}`}
        subtitle={appraisal.cycle.name}
      />
      <div className="p-6">
        <AppraisalDetailCard appraisal={appraisal} />
      </div>
    </div>
  );
}
