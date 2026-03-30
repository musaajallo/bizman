import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLoanById } from "@/lib/actions/loans";
import { getLoanSettings, getTeamMembersForApprovers } from "@/lib/actions/loan-settings";
import { LoanDetailCard } from "@/components/loans/loan-detail-card";
import { auth } from "@/lib/auth";

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [loan, session, loanSettings, members] = await Promise.all([
    getLoanById(id),
    auth(),
    getLoanSettings(),
    getTeamMembersForApprovers(),
  ]);

  if (!loan) notFound();

  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? session?.user?.email ?? "Unknown";

  // Can approve if: approverIds includes their userId, OR they are a company_admin
  const isApprover = loanSettings?.approverIds.includes(currentUserId) ?? false;
  const isAdmin = members.find((m) => m.userId === currentUserId)?.role === "company_admin";
  const canApprove = isApprover || isAdmin;

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
        <LoanDetailCard loan={loan} currentUserName={currentUserName} canApprove={canApprove} />
      </div>
    </div>
  );
}
