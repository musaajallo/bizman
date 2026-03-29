import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BenefitTypeForm } from "@/components/benefits/benefit-type-form";
import { getBenefitType } from "@/lib/actions/benefits";
import { notFound } from "next/navigation";

export default async function EditBenefitTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bt = await getBenefitType(id);
  if (!bt) notFound();

  return (
    <div>
      <TopBar title={`Edit: ${bt.name}`} subtitle="Update benefit type"
        actions={<Link href="/africs/hr/benefits"><Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6"><BenefitTypeForm existing={bt} /></div>
    </div>
  );
}
