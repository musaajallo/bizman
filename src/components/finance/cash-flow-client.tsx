"use client";

import { useRouter, usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
}

export function CashFlowClient({ data, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = fd.get("from") as string;
    const t = fd.get("to") as string;
    router.push(`${pathname}?from=${f}&to=${t}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" name="from" type="date" defaultValue={from} className="h-8 text-sm w-40" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" name="to" type="date" defaultValue={to} className="h-8 text-sm w-40" />
            </div>
            <Button type="submit" size="sm">Apply</Button>
            <a
              href={`/api/finance/cash-flow/pdf?from=${from}&to=${to}`}
              download
              className="ml-auto"
            >
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
            </a>
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
            <CardTitle className="text-base">Cash Flow Statement</CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(data.period.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {" – "}
              {new Date(data.period.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Operating */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Operating Activities
              </p>
              <div className="space-y-1">
                <CashRow label="Net Income" amount={data.netIncome} />
                <CashRow label="Depreciation (add-back)" amount={data.depreciation} />
                <CashRow label="Change in Accounts Receivable" amount={data.changeInAR} />
                <CashRow label="Change in Inventory" amount={data.changeInInventory} />
                <CashRow label="Change in Accounts Payable" amount={data.changeInAP} />
                <CashRow label="Change in Wages Payable" amount={data.changeInWagesPayable} />
              </div>
              <SubtotalRow label="Net Cash from Operating" amount={data.netOperating} />
            </section>

            <Separator />

            {/* Investing */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Investing Activities
              </p>
              <div className="space-y-1">
                <CashRow label="PP&E Purchases / Disposals" amount={data.ppePurchases} />
              </div>
              <SubtotalRow label="Net Cash from Investing" amount={data.netInvesting} />
            </section>

            <Separator />

            {/* Financing */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Financing Activities
              </p>
              <div className="space-y-1">
                <CashRow label="Loan Proceeds" amount={data.loanProceeds} />
                <CashRow label="Loan Repayments" amount={data.loanRepayments} />
                <CashRow label="Owner Drawings" amount={data.drawings} />
                <CashRow label="Capital Contributions" amount={data.capitalContributions} />
              </div>
              <SubtotalRow label="Net Cash from Financing" amount={data.netFinancing} />
            </section>

            <Separator />

            {/* Summary */}
            <section className="space-y-2">
              <div className="flex justify-between items-center text-sm px-2">
                <span className="text-muted-foreground">Opening Cash Balance</span>
                <span className="font-mono tabular-nums">{fmt(data.openingCash)}</span>
              </div>
              <div className={`flex justify-between items-center text-sm font-medium px-2 py-1 rounded ${data.netCashChange >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                <span>Net Change in Cash</span>
                <span className="font-mono tabular-nums">{sign(data.netCashChange)}{fmt(data.netCashChange)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold px-2.5 py-2.5 rounded-md bg-secondary">
                <span>Closing Cash Balance</span>
                <span className={`font-mono tabular-nums ${data.closingCash < 0 ? "text-destructive" : ""}`}>{fmt(data.closingCash)}</span>
              </div>
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CashRow({ label, amount }: { label: string; amount: number }) {
  if (amount === 0) return null;
  return (
    <div className="flex justify-between items-center text-sm py-0.5 px-2 rounded hover:bg-secondary/50">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono tabular-nums ${amount < 0 ? "text-destructive" : "text-emerald-600"}`}>
        {sign(amount)}{fmt(amount)}
      </span>
    </div>
  );
}

function SubtotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center text-sm font-semibold border-t mt-1 pt-1.5 px-2">
      <span>{label}</span>
      <span className={`font-mono tabular-nums ${amount < 0 ? "text-destructive" : ""}`}>{sign(amount)}{fmt(amount)}</span>
    </div>
  );
}
