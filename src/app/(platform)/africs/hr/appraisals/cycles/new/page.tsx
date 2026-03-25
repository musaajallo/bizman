import { TopBar } from "@/components/layout/top-bar";
import { AppraisalCycleForm } from "@/components/appraisals/appraisal-cycle-form";

export default function NewAppraisalCyclePage() {
  return (
    <div>
      <TopBar title="New Appraisal Cycle" subtitle="Create a performance review cycle" />
      <div className="p-6">
        <AppraisalCycleForm />
      </div>
    </div>
  );
}
