"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { BillStatusBadge } from "./bill-status-badge";

interface Bill {
  id: string;
  billNumber: string;
  title: string;
  totalAmount: number;
  amountDue: number;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string;
  vendor: { id: string; name: string };
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function BillListTable({ bills }: { bills: Bill[] }) {
  const router = useRouter();

  if (bills.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground text-sm">No bills found.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Bill #</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Vendor</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Total</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount Due</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr
                key={b.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/africs/accounting/bills/${b.id}`)}
              >
                <td className="py-3 px-4">
                  <p className="font-mono text-xs font-semibold">{b.billNumber}</p>
                  <p className="text-xs text-muted-foreground">{b.title}</p>
                </td>
                <td className="py-3 px-4 font-medium">{b.vendor.name}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                  {fmtDate(b.dueDate)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                  {fmt(b.totalAmount, b.currency)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm font-semibold">
                  {b.amountDue > 0 ? fmt(b.amountDue, b.currency) : "—"}
                </td>
                <td className="py-3 px-4">
                  <BillStatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
