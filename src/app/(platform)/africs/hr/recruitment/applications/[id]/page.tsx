import { getApplicationById } from "@/lib/actions/recruitment";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { ApplicationDetailCard } from "@/components/recruitment/application-detail-card";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  return (
    <div>
      <TopBar title={application.candidateName} subtitle="Application" />
      <div className="p-6">
        <ApplicationDetailCard application={application} />
      </div>
    </div>
  );
}
