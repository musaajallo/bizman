import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { ArrowLeft } from "lucide-react";
import { getBankAccountWithStatements } from "@/lib/actions/accounting/bank-reconciliation";
import { getAccountingPeriods } from "@/lib/actions/accounting/periods";
import { BankStatementsClient } from "@/components/accounting/bank-statements-client";

export default async function BankAccountStatementsPage({
  params,
}: {
  params: Promise<{ bankAccountId: string }>;
}) {
  const { bankAccountId } = await params;
  const [account, periods] = await Promise.all([
    getBankAccountWithStatements(bankAccountId),
    getAccountingPeriods(),
  ]);

  if (!account) notFound();

  return (
    <div>
      <TopBar
        title={account.name}
        subtitle={`${account.accountNumber}${account.bankName ? ` · ${account.bankName}` : ""}`}
        actions={
          <Link href="/africs/accounting/bank-reconciliation">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6 max-w-4xl">
        <BankStatementsClient
          bankAccountId={bankAccountId}
          currency={account.currency}
          statements={account.statements}
          periods={periods.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
