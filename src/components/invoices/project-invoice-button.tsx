"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { createInvoiceFromProject } from "@/lib/actions/invoices";

interface Props {
  projectId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function ProjectInvoiceButton({ projectId, variant = "outline", size = "sm" }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await createInvoiceFromProject(projectId);
    if (result.error) {
      alert(result.error);
      setGenerating(false);
      return;
    }
    if (result.invoiceId) {
      router.push(`/africs/accounting/invoices/${result.invoiceId}`);
    }
    setGenerating(false);
  };

  return (
    <Button variant={variant} size={size} className="gap-2" onClick={handleGenerate} disabled={generating}>
      {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
      Generate Invoice
    </Button>
  );
}
