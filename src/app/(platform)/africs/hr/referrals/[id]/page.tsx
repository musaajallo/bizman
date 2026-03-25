import { getReferralById } from "@/lib/actions/referrals";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { ReferralDetailCard } from "@/components/referrals/referral-detail-card";

export default async function ReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const referral = await getReferralById(id);
  if (!referral) notFound();

  return (
    <div>
      <TopBar title={referral.candidateName} subtitle="Referral" />
      <div className="p-6">
        <ReferralDetailCard referral={referral} />
      </div>
    </div>
  );
}
