"use client";

import { useRouter, usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CashFlowStatement } from "@/lib/actions/accounting/statements";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function sign(n: number) {
  return n >= 0 ? "+" : "";
}

interface Props {
  data: CashFlowStatement | null;
  from: string;
  to: string;
  priorFrom?: string;
  priorTo?: string;
}

export function CashFlowClient({ data, from, to, priorFrom, priorTo }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      from: fd.get("from") as string,
      to:   fd.get("to")   as string,
    });
    const pf = fd.get("priorFrom") as string;
    const pt = fd.get("priorTo")   as string;
    if (pf && pt) { params.set("priorFrom", pf); params.set("priorTo", pt); }
    router.push(`${pathname}?${params}`);
  }

  const hasPrior = !!data?.prior;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label htmlFor="from" className="text-xs">From</Label>
                <Input id="from" name="from" type="date" defaultValue={from} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to" className="text-xs">To</Label>
                <Input id="to" name="to" type="date" defaultValue={to} className="h-8 text-sm w-40" />
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
            <div className="ml-auto flex gap-2">
              <a href={`/api/finance/cash-flow/csv?from=${from}&to=${to}`} download>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />CSV
                </Button>
              </a>
              <a href={`/api/finance/cash-flow/pdf?from=${from}&to=${to}`} download>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />PDF
                </Button>
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      {!data ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground py-12">
            No data for the selected period.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Cash Flow Statement</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(data.period.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {" – "}
                  {new Date(data.period.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {hasPrior && <Badge variant="outline" className="text-xs">Comparative</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasPrior && (
              <div className="flex justify-end gap-2 px-2 pb-1 border-b">
                <span className="text-xs text-muted-foreground w-28 text-right">Prior Period</span>
                <span className="text-xs font-medium w-28 text-right">Current</span>
                <span className="text-xs text-muted-foreground w-24 text-right">Change</span>
              </div>
            )}

            {/* Operating */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Operating Activities
              </p>
              <div className="space-y-1">
                <CashRow label="Net Income"                      current={data.netIncome}            prior={data.prior?.netIncome} />
                <CashRow label="Depreciation (add-back)"         current={data.depreciation}         prior={data.prior?.depreciation} />
                <CashRow label="Change in Accounts Receivable"   current={data.changeInAR}           prior={data.prior?.changeInAR} />
                <CashRow label="Change in Inventory"             current={data.changeInInventory}    prior={data.prior?.changeInInventory} />
                <CashRow label="Change in Accounts Payable"      current={data.changeInAP}           prior={data.prior?.changeInAP} />
                <CashRow label="Change in Wages Payable"         current={data.changeInWagesPayable} prior={data.prior?.changeInWagesPayable} />
              </div>
              <SubtotalRow label="Net Cash from Operating" current={data.netOperating} prior={data.prior?.netOperating} />
            </section>

            <Separator />

            {/* Investing */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Investing Activities
              </p>
              <div className="space-y-1">
                <CashRow label="PP&E Purchases / Disposals" current={data.ppePurchases} prior={data.prior?.ppePurchases} />
              </div>
              <SubtotalRow label="Net Cash from Investing" current={data.netInvesting} prior={data.prior?.netInvesting} />
            </section>

            <Separator />

            {/* Financing */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Financing Activities
              </p>
              <div className="space-y-1">
                <CashRow label="Loan Proceeds"           current={data.loanProceeds}         prior={data.prior?.loanProceeds} />
                <CashRow label="Loan Repayments"         current={data.loanRepayments}        prior={data.prior?.loanRepayments} />
                <CashRow label="Owner Drawings"          current={data.drawings}              prior={data.prior?.drawings} />
                <CashRow label="Capital Contributions"   current={data.capitalContributions}  prior={data.prior?.capitalContributions} />
              </div>
              <SubtotalRow label="Net Cash from Financing" current={data.netFinancing} prior={data.prior?.netFinancing} />
            </section>

            <Separator />

            {/* Summary */}
            <section className="space-y-2">
              <SummaryRow label="Opening Cash Balance" current={data.openingCash} prior={data.prior?.openingCash} muted />
              <SummaryRow label="Net Change in Cash"   current={data.netCashChange} prior={data.prior?.netCashChange} signed colored />
              <SummaryRow label="Closing Cash Balance" current={data.closingCash} prior={data.prior?.closingCash} bold />
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CashRow({ label, current, prior }: { label: string; current: number; prior?: number }) {
  const hasPrior = prior !== undefined;
  if (current === 0 && (!hasPrior || prior === 0)) return null;
  const diff = hasPrior ? current - prior : null;
  return (
    <div className="flex justify-between items-center text-sm py-0.5 px-2 rounded hover:bg-secondary/50">
      <span className="text-muted-foreground flex-1">{label}</span>
      <div className="flex items-center gap-2">
        {hasPrior && (
          <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">
            {prior !== 0 ? `${sign(prior!)}${fmt(prior!)}` : "—"}
          </span>
        )}
        <span className={`font-mono tabular-nums w-28 text-right ${current < 0 ? "text-destructive" : current > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
          {sign(current)}{fmt(current)}
        </span>
        {diff !== null && (
          <span className={`font-mono tabular-nums text-xs w-24 text-right ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {diff > 0 ? "+" : ""}{fmt(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

function SubtotalRow({ label, current, prior }: { label: string; current: number; prior?: number }) {
  const hasPrior = prior !== undefined;
  const diff = hasPrior ? current - prior : null;
  return (
    <div className="flex justify-between items-center text-sm font-semibold border-t mt-1 pt-1.5 px-2">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        {hasPrior && (
          <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">
            {sign(prior!)}{fmt(prior!)}
          </span>
        )}
        <span className={`font-mono tabular-nums w-28 text-right ${current < 0 ? "text-destructive" : ""}`}>
          {sign(current)}{fmt(current)}
        </span>
        {diff !== null && (
          <span className={`font-mono tabular-nums text-xs w-24 text-right ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {diff > 0 ? "+" : ""}{fmt(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label, current, prior, muted, signed, colored, bold,
}: {
  label: string; current: number; prior?: number;
  muted?: boolean; signed?: boolean; colored?: boolean; bold?: boolean;
}) {
  const hasPrior = prior !== undefined;
  const diff = hasPrior ? current - prior : null;
  const valueStr = signed ? `${sign(current)}${fmt(current)}` : fmt(current);
  const priorStr = (prior !== undefined && signed) ? `${sign(prior)}${fmt(prior)}` : prior !== undefined ? fmt(prior) : undefined;

  let valueColor = "";
  if (colored) valueColor = current >= 0 ? "text-emerald-600" : "text-destructive";
  else if (current < 0) valueColor = "text-destructive";

  const wrapClass = bold
    ? "flex justify-between items-center text-sm font-bold px-2.5 py-2.5 rounded-md bg-secondary"
    : `flex justify-between items-center text-sm px-2 ${muted ? "" : "font-medium"}`;

  return (
    <div className={wrapClass}>
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <div className="flex items-center gap-2">
        {hasPrior && (
          <span className="font-mono tabular-nums text-xs text-muted-foreground w-28 text-right">
            {priorStr}
          </span>
        )}
        <span className={`font-mono tabular-nums w-28 text-right ${valueColor}`}>{valueStr}</span>
        {diff !== null && (
          <span className={`font-mono tabular-nums text-xs w-24 text-right ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {diff > 0 ? "+" : ""}{fmt(diff)}
          </span>
        )}
      </div>
    </div>
  );
}
