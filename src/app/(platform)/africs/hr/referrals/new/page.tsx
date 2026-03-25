import { TopBar } from "@/components/layout/top-bar";
import { ReferralForm } from "@/components/referrals/referral-form";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { getJobPostings } from "@/lib/actions/recruitment";
import { notFound } from "next/navigation";

export default async function NewReferralPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [employees, openPostings] = await Promise.all([
    getEmployeesForSelect(owner.id),
    getJobPostings({ status: "open" }),
  ]);

  return (
    <div>
      <TopBar title="New Referral" subtitle="Submit a candidate referral" />
      <div className="p-6">
        <ReferralForm
          employees={employees}
          openPostings={openPostings.map((p) => ({ id: p.id, title: p.title, department: p.department }))}
        />
      </div>
    </div>
  );
}
