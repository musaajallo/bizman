"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { RetainedEarningsStatement } from "@/lib/actions/accounting/statements";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface Props {
  data:  RetainedEarningsStatement | null;
  from:  string;
  to:    string;
  priorFrom?: string;
  priorTo?:   string;
}

function StatementRow({
  label, current, prior, indent, strong, separator,
}: {
  label: string;
  current: number;
  prior?: number;
  indent?: boolean;
  strong?: boolean;
  separator?: boolean;
}) {
  const isNeg = current < 0;
  return (
    <>
      {separator && <Separator className="my-1" />}
      <div className={`flex items-center justify-between py-1.5 px-3 rounded ${strong ? "bg-secondary font-semibold" : "hover:bg-secondary/40"} ${indent ? "pl-6" : ""}`}>
        <span className={`text-sm ${strong ? "font-bold" : ""}`}>{label}</span>
        <div className="flex items-center gap-8">
          {prior !== undefined && (
            <span className="font-mono tabular-nums text-sm text-muted-foreground w-28 text-right">{fmt(prior)}</span>
          )}
          <span className={`font-mono tabular-nums text-sm w-28 text-right ${strong ? "font-bold" : ""} ${isNeg ? "text-destructive" : ""}`}>
            {fmt(current)}
          </span>
        </div>
      </div>
    </>
  );
}

export function RetainedEarningsClient({ data, from, to, priorFrom, priorTo }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f  = fd.get("from") as string;
    const t  = fd.get("to") as string;
    const pf = fd.get("priorFrom") as string;
    const pt = fd.get("priorTo") as string;
    const params = new URLSearchParams({ from: f, to: t });
    if (pf && pt) { params.set("priorFrom", pf); params.set("priorTo", pt); }
    router.push(`${pathname}?${params}`);
  }

  const hasPrior = !!data?.prior;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input name="from" type="date" defaultValue={from} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input name="to" type="date" defaultValue={to} className="h-8 text-sm w-40" />
              </div>
              <div className="border-l mx-1 self-stretch" />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prior From (comparative)</Label>
                <Input name="priorFrom" type="date" defaultValue={priorFrom ?? ""} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prior To</Label>
                <Input name="priorTo" type="date" defaultValue={priorTo ?? ""} className="h-8 text-sm w-40" />
              </div>
            </div>
            <Button type="submit" size="sm">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {!data ? (
        <Card>
          <CardContent className="pt-6 py-12 text-center text-sm text-muted-foreground">
            No data for the selected period.
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Statement of Retained Earnings</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(data.period.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {" – "}
                  {new Date(data.period.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {hasPrior && (
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">Comparative</p>
                  <Badge variant="outline" className="text-xs mt-1">Prior Period</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {hasPrior && (
              <div className="flex justify-end gap-8 px-3 pb-1 border-b">
                <span className="text-xs text-muted-foreground w-28 text-right">Prior Period</span>
                <span className="text-xs font-medium w-28 text-right">Current Period</span>
              </div>
            )}

            <StatementRow
              label="Opening Retained Earnings"
              current={data.openingRE}
              prior={data.prior?.openingRE}
            />
            <StatementRow
              label="Net Income for Period"
              current={data.netIncome}
              prior={data.prior?.netIncome}
              indent
            />
            <StatementRow
              label="Less: Drawings / Distributions"
              current={-data.drawings}
              prior={data.prior ? -data.prior.drawings : undefined}
              indent
            />
            <StatementRow
              label="Closing Retained Earnings"
              current={data.closingRE}
              prior={data.prior?.closingRE}
              strong
              separator
            />

            <div className="pt-4">
              <p className="text-xs text-muted-foreground px-3">
                Closing Retained Earnings represents accumulated profits less distributions since inception.
                This balance is carried forward to the Balance Sheet under Equity.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
