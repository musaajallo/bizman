import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BenefitTypeForm } from "@/components/benefits/benefit-type-form";

export default function NewBenefitTypePage() {
  return (
    <div>
      <TopBar title="New Benefit Type" subtitle="Define a new employee benefit"
        actions={<Link href="/africs/hr/benefits"><Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6"><BenefitTypeForm /></div>
    </div>
  );
}
