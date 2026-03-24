"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { VendorStatusBadge } from "./vendor-status-badge";
import { PAYMENT_TERMS } from "@/lib/bill-constants";

interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  paymentTerms: string;
  status: string;
  _count: { bills: number };
}

const termLabel = (v: string) => PAYMENT_TERMS.find((t) => t.value === v)?.label ?? v;

export function VendorListTable({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();

  if (vendors.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground text-sm">No vendors found.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Vendor</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Terms</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Bills</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr
                key={v.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/africs/accounting/vendors/${v.id}`)}
              >
                <td className="py-3 px-4">
                  <p className="font-medium">{v.name}</p>
                  {v.email && <p className="text-xs text-muted-foreground">{v.email}</p>}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                  {v.contactName || "—"}
                  {v.phone && <p className="text-xs">{v.phone}</p>}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                  {termLabel(v.paymentTerms)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm hidden sm:table-cell">
                  {v._count.bills}
                </td>
                <td className="py-3 px-4">
                  <VendorStatusBadge status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
