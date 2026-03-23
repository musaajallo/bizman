"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { processRecurringInvoices } from "@/lib/actions/invoices";

export function ProcessRecurringButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handle = async () => {
    setProcessing(true);
    const result = await processRecurringInvoices(tenantId);
    setProcessing(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.generated === 0) {
      alert("No recurring invoices are due yet.");
    } else {
      alert(`Generated ${result.generated} invoice${result.generated !== 1 ? "s" : ""}.`);
    }
    router.refresh();
  };

  return (
    <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs" onClick={handle} disabled={processing}>
      {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Process Due
    </Button>
  );
}
