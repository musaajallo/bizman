import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/top-bar";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getStatement, getReconciliationSummary } from "@/lib/actions/accounting/bank-reconciliation";
import { ReconciliationWorkbench } from "@/components/accounting/reconciliation-workbench";

export default async function ReconciliationWorkbenchPage({
  params,
}: {
  params: Promise<{ bankAccountId: string; statementId: string }>;
}) {
  const { bankAccountId, statementId } = await params;
  const [stmt, summary] = await Promise.all([
    getStatement(statementId),
    getReconciliationSummary(statementId),
  ]);

  if (!stmt || !summary) notFound();

  const confirmed = stmt.status === "confirmed";

  return (
    <div>
      <TopBar
        title={`${stmt.bankAccount.name} — ${stmt.period.name}`}
        subtitle={`Bank Reconciliation Workbench${confirmed ? " (Confirmed)" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {confirmed && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />Confirmed
              </Badge>
            )}
            <Link href={`/africs/accounting/bank-reconciliation/${bankAccountId}`}>
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <ReconciliationWorkbench
          statementId={statementId}
          bankAccountId={bankAccountId}
          lines={stmt.lines}
          summary={summary}
          status={stmt.status}
          confirmed={confirmed}
        />
      </div>
    </div>
  );
}
