import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getBenefitTypes, getTenantBenefitSummary } from "@/lib/actions/benefits";
import { BenefitsPageClient } from "@/components/benefits/benefits-page-client";

export default async function BenefitsPage() {
  const [benefitTypes, summary] = await Promise.all([
    getBenefitTypes(),
    getTenantBenefitSummary(),
  ]);

  return (
    <div>
      <TopBar
        title="Benefits"
        subtitle="Manage benefit types and employee assignments"
        actions={
          <Link href="/africs/hr/benefits/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />New Benefit Type
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <BenefitsPageClient benefitTypes={benefitTypes} summary={summary} />
      </div>
    </div>
  );
}
