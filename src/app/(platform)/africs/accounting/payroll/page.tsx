import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getPayrollRuns } from "@/lib/actions/payroll";
import { PayrollRunList } from "@/components/payroll/payroll-run-list";

const STATUSES = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
];

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const runs = await getPayrollRuns({
    status: sp.status || undefined,
    year: sp.year ? parseInt(sp.year) : undefined,
  });

  const serialized = runs.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    processedAt: r.processedAt?.toISOString() ?? null,
    paidAt: r.paidAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <TopBar
        title="Payroll"
        subtitle="Salary runs and payslips"
        actions={
          <Link href="/africs/accounting/payroll/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              New Payroll Run
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        {/* Status filter tabs */}
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <Link
              key={s.value}
              href={s.value ? `/africs/accounting/payroll?status=${s.value}` : "/africs/accounting/payroll"}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                (sp.status ?? "") === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <PayrollRunList runs={serialized} />
      </div>
    </div>
  );
}
