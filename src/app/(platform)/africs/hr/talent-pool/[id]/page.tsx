import { getTalentPoolEntryById } from "@/lib/actions/talent-pool";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { TalentPoolDetailCard } from "@/components/talent-pool/talent-pool-detail-card";

export default async function TalentPoolEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getTalentPoolEntryById(id);
  if (!entry) notFound();

  return (
    <div>
      <TopBar title={entry.name} subtitle="Talent pool candidate" />
      <div className="p-6">
        <TalentPoolDetailCard entry={entry} />
      </div>
    </div>
  );
}
