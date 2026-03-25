import { getJobPostingById } from "@/lib/actions/recruitment";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { JobPostingForm } from "@/components/recruitment/job-posting-form";

export default async function EditJobPostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posting = await getJobPostingById(id);
  if (!posting) notFound();

  return (
    <div>
      <TopBar title="Edit Job Posting" subtitle={posting.title} />
      <div className="p-6">
        <JobPostingForm posting={posting} />
      </div>
    </div>
  );
}
