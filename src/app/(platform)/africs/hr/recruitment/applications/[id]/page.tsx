import { getApplicationById } from "@/lib/actions/recruitment";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { ApplicationDetailCard } from "@/components/recruitment/application-detail-card";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await getOwnerBusiness();
  const [application, employees] = await Promise.all([
    getApplicationById(id),
    owner ? getEmployeesForSelect(owner.id) : Promise.resolve([]),
  ]);
  if (!application) notFound();

  return (
    <div>
      <TopBar title={application.candidateName} subtitle="Application" />
      <div className="p-6">
        <ApplicationDetailCard application={application} employees={employees} />
      </div>
    </div>
  );
}
