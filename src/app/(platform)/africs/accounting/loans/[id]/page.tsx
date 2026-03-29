import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLoanById } from "@/lib/actions/loans";
import { LoanDetailCard } from "@/components/loans/loan-detail-card";

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loan = await getLoanById(id);
  if (!loan) notFound();

  return (
    <div>
      <TopBar
        title={loan.borrowerName}
        subtitle={`Loan ${loan.loanNumber}`}
        actions={
          <Link href="/africs/accounting/loans">
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <LoanDetailCard loan={loan} />
      </div>
    </div>
  );
}
