import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getLoans, getLoanStats } from "@/lib/actions/loans";
import { LoansTable } from "@/components/loans/loans-table";
import { Plus, Banknote, TrendingDown, RefreshCcw, AlertCircle } from "lucide-react";

export default async function LoansPage() {
  const [stats, loans] = await Promise.all([getLoanStats(), getLoans()]);

  return (
    <div>
      <TopBar
        title="Loans"
        subtitle="Staff loans, owner loans and salary advances"
        actions={
          <Link href="/africs/accounting/loans/new">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Loan</Button>
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Loans", value: stats.totalLoans, icon: Banknote, color: "text-primary" },
            { label: "Total Outstanding", value: `GMD ${stats.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-amber-400" },
            { label: "Repaid This Month", value: `GMD ${stats.repaymentsThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: RefreshCcw, color: "text-emerald-400" },
            { label: "Overdue", value: stats.overdueCount, icon: AlertCircle, color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-base font-semibold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-md border overflow-hidden">
          <LoansTable loans={loans} />
        </div>
      </div>
    </div>
  );
}
