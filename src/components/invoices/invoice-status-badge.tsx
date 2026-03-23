import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  sent: { label: "Sent", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  viewed: { label: "Viewed", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  overdue: { label: "Overdue", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  void: { label: "Void", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 line-through" },
  accepted: { label: "Accepted", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  converted: { label: "Converted", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  expired: { label: "Expired", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
