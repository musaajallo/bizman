"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PublicInvoiceActions({ invoiceId }: { invoiceId: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => window.open(`/api/invoices/${invoiceId}/pdf`, "_blank")}
    >
      <Download className="h-3.5 w-3.5" />
      Download PDF
    </Button>
  );
}
