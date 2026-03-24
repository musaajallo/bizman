"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentDialog } from "./payment-dialog";
import { PaymentHistory } from "./payment-history";
import { InvoiceActivityFeed } from "./invoice-activity-feed";
import { RecurringInvoiceSettings } from "./recurring-invoice-settings";
import { InvoiceStatusBadge } from "./invoice-status-badge";

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  notes: string | null;
  date: Date | string;
  recordedBy: { id: string; name: string | null };
}

interface Activity {
  id: string;
  action: string;
  details: unknown;
  createdAt: Date | string;
  actor: { id: string; name: string | null } | null;
}

interface CreditNote {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
}

interface Props {
  invoiceId: string;
  invoiceType?: string;
  status: string;
  amountDue: number;
  currency: string;
  payments: Payment[];
  activities: Activity[];
  isRecurring: boolean;
  recurringInterval: string | null;
  nextRecurringDate: Date | string | null;
  creditNotes?: CreditNote[];
}

export function InvoiceDetailSidebar({ invoiceId, invoiceType, status, amountDue, currency, payments, activities, isRecurring, recurringInterval, nextRecurringDate, creditNotes }: Props) {
  const router = useRouter();

  const canRecordPayment = status !== "draft" && status !== "void" && status !== "paid" && invoiceType !== "credit_note";

  return (
    <div className="space-y-6">
      {/* Payments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Payments</CardTitle>
            {canRecordPayment && (
              <PaymentDialog
                invoiceId={invoiceId}
                amountDue={amountDue}
                currency={currency}
                onRecorded={() => router.refresh()}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PaymentHistory
            payments={payments}
            currency={currency}
            onUpdated={() => router.refresh()}
          />
        </CardContent>
      </Card>

      {/* Recurring */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recurring</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringInvoiceSettings
            invoiceId={invoiceId}
            isRecurring={isRecurring}
            recurringInterval={recurringInterval}
            nextRecurringDate={nextRecurringDate}
          />
        </CardContent>
      </Card>

      {/* Credit Notes — shown on standard invoices */}
      {invoiceType === "standard" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Credit Notes</CardTitle>
              <Link href={`/africs/accounting/credit-notes/new?invoiceId=${invoiceId}`} className="text-xs text-muted-foreground hover:text-foreground">
                + Issue
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!creditNotes || creditNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No credit notes issued.</p>
            ) : (
              <div className="space-y-2">
                {creditNotes.map((cn) => (
                  <div key={cn.id} className="flex items-center justify-between text-xs">
                    <Link href={`/africs/accounting/credit-notes/${cn.id}`} className="font-mono hover:underline">
                      {cn.invoiceNumber}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: cn.currency }).format(cn.total)}
                      </span>
                      <InvoiceStatusBadge status={cn.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceActivityFeed activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
