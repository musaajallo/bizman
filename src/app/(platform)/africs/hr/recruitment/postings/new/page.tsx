import { TopBar } from "@/components/layout/top-bar";
import { JobPostingForm } from "@/components/recruitment/job-posting-form";

export default function NewJobPostingPage() {
  return (
    <div>
      <TopBar title="New Job Posting" subtitle="Create a new open position" />
      <div className="p-6">
        <JobPostingForm />
      </div>
    </div>
  );
}
