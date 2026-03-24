import { Badge } from "@/components/ui/badge";

const typeConfig: Record<string, { label: string; className: string }> = {
  standard: { label: "Invoice", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  proforma: { label: "Proforma", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  credit_note: { label: "Credit Note", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export function InvoiceTypeBadge({ type }: { type: string }) {
  const config = typeConfig[type] || typeConfig.standard;
  return (
    <Badge variant="outline" className={`${config.className} text-[10px] px-1.5 py-0`}>
      {config.label}
    </Badge>
  );
}
