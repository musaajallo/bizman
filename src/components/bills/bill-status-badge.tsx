import { Badge } from "@/components/ui/badge";

const CONFIG: Record<string, { label: string; className: string }> = {
  draft:          { label: "Draft",         className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  approved:       { label: "Approved",      className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  partially_paid: { label: "Partial",       className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  paid:           { label: "Paid",          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  overdue:        { label: "Overdue",       className: "bg-red-500/10 text-red-400 border-red-500/20" },
  void:           { label: "Void",          className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

export function BillStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? CONFIG.draft;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
