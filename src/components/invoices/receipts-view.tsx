"use client";

import { useState } from "react";
import { List, LayoutGrid, ScrollText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiptPreview, receiptNumber } from "@/components/invoices/receipt-preview";
import Link from "next/link";
import { cn } from "@/lib/utils";

type View = "list" | "card" | "receipt";

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  date: Date;
}

interface Receipt {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  currency: string;
  total: number;
  amountPaid: number;
  paidDate: Date | null;
  projectName: string | null;
  payments: Payment[];
}

interface Props {
  receipts: Receipt[];
  ownerName: string;
  accentColor: string | null | undefined;
  logoUrl: string | null | undefined;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  cheque: "Cheque",
  card: "Card",
  mobile_money: "Mobile money",
  credit_note: "Credit note",
  other: "Other",
};

export function ReceiptsView({ receipts, ownerName, accentColor, logoUrl }: Props) {
  const [view, setView] = useState<View>("list");

  const toggleBtn = (v: View, Icon: React.ElementType, label: string) => (
    <Button
      size="sm"
      variant="ghost"
      className={cn("h-8 w-8 p-0", view === v && "bg-muted text-foreground")}
      onClick={() => setView(v)}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const toolbar = (
    <div className="flex items-center gap-0.5 border rounded-md p-0.5">
      {toggleBtn("list", List, "List view")}
      {toggleBtn("card", LayoutGrid, "Card view")}
      {toggleBtn("receipt", ScrollText, "Receipt view")}
    </div>
  );

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{toolbar}</div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Receipt #</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Method</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount Paid</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Paid Date</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  const method = r.payments[0]?.method;
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-xs">
                        {receiptNumber(r.invoiceNumber)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{r.clientName}</div>
                        {r.clientEmail && (
                          <div className="text-xs text-muted-foreground">{r.clientEmail}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{r.projectName ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {method ? (METHOD_LABELS[method] ?? method) : "—"}
                        {r.payments.length > 1 && (
                          <span className="ml-1 text-muted-foreground/60">+{r.payments.length - 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {formatCurrency(r.amountPaid, r.currency)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(r.paidDate)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                          <Link
                            href={`/africs/accounting/invoices/${r.id}`}
                            className="hover:text-foreground transition-colors whitespace-nowrap"
                          >
                            View invoice
                          </Link>
                          <a
                            href={`/api/invoices/${r.id}/receipt`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ── Card view ──────────────────────────────────────────────────────────────
  if (view === "card") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{toolbar}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {receipts.map((r) => (
            <Card key={r.id} className="hover:border-border/80 transition-colors">
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-medium text-muted-foreground">
                      {receiptNumber(r.invoiceNumber)}
                    </p>
                    <p className="font-semibold mt-0.5 truncate">{r.clientName}</p>
                  </div>
                  <p className="font-mono font-semibold text-emerald-400 whitespace-nowrap">
                    {formatCurrency(r.amountPaid, r.currency)}
                  </p>
                </div>

                {r.projectName && (
                  <p className="text-xs text-muted-foreground truncate">{r.projectName}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span>{formatDate(r.paidDate)}</span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/africs/accounting/invoices/${r.id}`}
                      className="hover:text-foreground transition-colors"
                    >
                      Invoice →
                    </Link>
                    <a
                      href={`/api/invoices/${r.id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Receipt view (original) ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex justify-end">{toolbar}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {receipts.map((r) => (
          <div key={r.id} className="space-y-3">
            <ReceiptPreview
              invoiceId={r.id}
              invoiceNumber={r.invoiceNumber}
              clientName={r.clientName}
              clientEmail={r.clientEmail}
              currency={r.currency}
              amountPaid={r.amountPaid}
              paidDate={r.paidDate}
              payments={r.payments}
              projectName={r.projectName}
              ownerName={ownerName}
              accentColor={accentColor}
              logoUrl={logoUrl}
            />
            <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
              <Link
                href={`/africs/accounting/invoices/${r.id}`}
                className="hover:text-foreground transition-colors"
              >
                View invoice →
              </Link>
              <a
                href={`/api/invoices/${r.id}/receipt`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" />
                {receiptNumber(r.invoiceNumber)}.pdf
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
