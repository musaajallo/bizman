import { getJobPostingById } from "@/lib/actions/recruitment";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PostingDetailCard } from "@/components/recruitment/posting-detail-card";

export default async function JobPostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posting = await getJobPostingById(id);
  if (!posting) notFound();

  return (
    <div>
      <TopBar title={posting.title} subtitle="Job posting" />
      <div className="p-6">
        <PostingDetailCard posting={posting} />
      </div>
    </div>
  );
}
