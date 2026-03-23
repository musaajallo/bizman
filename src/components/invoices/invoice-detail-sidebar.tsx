"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDialog } from "./payment-dialog";
import { PaymentHistory } from "./payment-history";
import { InvoiceActivityFeed } from "./invoice-activity-feed";
import { RecurringInvoiceSettings } from "./recurring-invoice-settings";

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

interface Props {
  invoiceId: string;
  status: string;
  amountDue: number;
  currency: string;
  payments: Payment[];
  activities: Activity[];
  isRecurring: boolean;
  recurringInterval: string | null;
  nextRecurringDate: Date | string | null;
}

export function InvoiceDetailSidebar({ invoiceId, status, amountDue, currency, payments, activities, isRecurring, recurringInterval, nextRecurringDate }: Props) {
  const router = useRouter();

  const canRecordPayment = status !== "draft" && status !== "void" && status !== "paid";

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
