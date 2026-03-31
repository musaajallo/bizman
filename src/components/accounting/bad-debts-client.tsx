"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, MoreHorizontal, TrendingDown, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { BadDebtConfigDialog } from "./bad-debt-config-dialog";
import { WriteOffDialog } from "./write-off-dialog";
import { postAllowanceAdjustment, type AgingBucket } from "@/lib/actions/accounting/bad-debts";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface ARRow {
  id:             string;
  invoiceNumber:  string;
  clientName:     string;
  dueDate:        string;
  outstanding:    number;
  ageDays:        number;
  bucketLabel:    string;
  reservePercent: number;
  allowanceAmount:number;
  netRealisable:  number;
}

interface BucketSummary {
  bucketLabel:    string;
  reservePercent: number;
  grossAR:        number;
  allowance:      number;
  netRealisable:  number;
  count:          number;
}

interface Props {
  rows:              ARRow[];
  bucketSummary:     BucketSummary[];
  totalGrossAR:      number;
  totalAllowance:    number;
  totalNRV:          number;
  currentGLBalance:  number;
  agingBuckets:      AgingBucket[];
}

export function BadDebtsClient({
  rows, bucketSummary, totalGrossAR, totalAllowance, totalNRV,
  currentGLBalance, agingBuckets,
}: Props) {
  const router = useRouter();
  const [configOpen, setConfigOpen]         = useState(false);
  const [isPending, startTransition]        = useTransition();
  const [writeOffInvoice, setWriteOffInvoice] = useState<ARRow | null>(null);
  const [recoveryInvoice, setRecoveryInvoice] = useState<ARRow | null>(null);
  const [actionMsg, setActionMsg]           = useState<{ type: "error" | "info"; text: string } | null>(null);

  const provisionGap = totalAllowance - currentGLBalance;
  const isOverProvisioned = provisionGap < 0;

  function handlePostAdjustment() {
    setActionMsg(null);
    startTransition(async () => {
      const res = await postAllowanceAdjustment({ requiredAllowance: totalAllowance });
      if (res.error) { setActionMsg({ type: "error", text: res.error }); return; }
      if (res.adjustment === 0) {
        setActionMsg({ type: "info", text: "Allowance is already at the required level — no adjustment needed." });
      } else {
        const adj = res.adjustment ?? 0;
        setActionMsg({ type: "info", text: `Allowance adjusted by ${fmt(Math.abs(adj))} (${adj > 0 ? "increase" : "decrease"})` });
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className={`flex items-center gap-2 text-sm rounded px-3 py-2 ${actionMsg.type === "error" ? "text-destructive bg-destructive/10" : "text-emerald-400 bg-emerald-500/10"}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />{actionMsg.text}
          <button className="ml-auto text-xs" onClick={() => setActionMsg(null)}>✕</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Gross AR Outstanding</p>
            <p className="text-2xl font-bold font-mono mt-1">{fmt(totalGrossAR)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Required Allowance</p>
            <p className="text-2xl font-bold font-mono text-orange-400 mt-1">{fmt(totalAllowance)}</p>
            <p className="text-xs text-muted-foreground mt-1">GL Balance: {fmt(currentGLBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Net Realisable Value</p>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{fmt(totalNRV)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Provision gap alert */}
      {Math.abs(provisionGap) > 0.01 && (
        <Card className={`border-${isOverProvisioned ? "emerald" : "orange"}-500/30`}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isOverProvisioned
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                : <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />
              }
              <div>
                <p className="text-sm font-medium">
                  {isOverProvisioned
                    ? `Over-provisioned by ${fmt(Math.abs(provisionGap))}`
                    : `Under-provisioned by ${fmt(provisionGap)}`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOverProvisioned
                    ? "Allowance exceeds required amount. Reverse the excess to release income."
                    : "Additional provision needed. Post adjusting entry to increase the allowance."
                  }
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handlePostAdjustment} disabled={isPending}>
              {isPending ? "Posting…" : "Post Adjustment"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bucket summary */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Allowance by Aging Bucket</CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfigOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" />Configure Rates
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Bucket</TableHead>
                <TableHead className="text-right text-xs">Reserve %</TableHead>
                <TableHead className="text-right text-xs">Gross AR</TableHead>
                <TableHead className="text-right text-xs">Allowance</TableHead>
                <TableHead className="text-right text-xs">Net Realisable</TableHead>
                <TableHead className="text-right text-xs">Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bucketSummary.map((b) => (
                <TableRow key={b.bucketLabel}>
                  <TableCell className="text-sm py-2">{b.bucketLabel}</TableCell>
                  <TableCell className="text-right text-sm py-2 font-mono">{b.reservePercent}%</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm py-2">{fmt(b.grossAR)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm text-orange-400 py-2">{fmt(b.allowance)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm text-emerald-400 py-2">{fmt(b.netRealisable)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground py-2">{b.count}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold bg-secondary/20">
                <TableCell className="py-2 text-sm" colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-mono tabular-nums py-2">{fmt(totalGrossAR)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-orange-400 py-2">{fmt(totalAllowance)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-emerald-400 py-2">{fmt(totalNRV)}</TableCell>
                <TableCell className="text-right text-muted-foreground py-2">{rows.length}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice detail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Outstanding Receivables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No outstanding receivables.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Invoice</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Due Date</TableHead>
                  <TableHead className="text-xs">Age</TableHead>
                  <TableHead className="text-right text-xs">Outstanding</TableHead>
                  <TableHead className="text-right text-xs">Allowance</TableHead>
                  <TableHead className="text-right text-xs">NRV</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs py-2">{r.invoiceNumber}</TableCell>
                    <TableCell className="text-sm py-2">{r.clientName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">
                      {new Date(r.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className={`text-xs ${
                        r.ageDays > 90 ? "bg-destructive/10 text-destructive border-destructive/20" :
                        r.ageDays > 60 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                        r.ageDays > 30 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                        "bg-secondary"
                      }`}>
                        {r.ageDays}d
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm py-2">{fmt(r.outstanding)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm text-orange-400 py-2">{fmt(r.allowanceAmount)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm text-emerald-400 py-2">{fmt(r.netRealisable)}</TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setWriteOffInvoice(r)}>
                            <TrendingDown className="h-3.5 w-3.5 mr-2" />Write Off
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRecoveryInvoice(r)}>
                            <RefreshCw className="h-3.5 w-3.5 mr-2" />Record Recovery
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BadDebtConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        buckets={agingBuckets}
      />

      {writeOffInvoice && (
        <WriteOffDialog
          open
          onOpenChange={(v) => !v && setWriteOffInvoice(null)}
          mode="write-off"
          invoiceId={writeOffInvoice.id}
          invoiceNumber={writeOffInvoice.invoiceNumber}
          clientName={writeOffInvoice.clientName}
          outstanding={writeOffInvoice.outstanding}
        />
      )}

      {recoveryInvoice && (
        <WriteOffDialog
          open
          onOpenChange={(v) => !v && setRecoveryInvoice(null)}
          mode="recovery"
          invoiceId={recoveryInvoice.id}
          invoiceNumber={recoveryInvoice.invoiceNumber}
          clientName={recoveryInvoice.clientName}
          outstanding={recoveryInvoice.outstanding}
        />
      )}
    </div>
  );
}
