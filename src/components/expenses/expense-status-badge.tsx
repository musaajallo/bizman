import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:       { label: "Draft",       className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  submitted:   { label: "Pending",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved:    { label: "Approved",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  rejected:    { label: "Rejected",    className: "bg-red-500/10 text-red-400 border-red-500/20" },
  reimbursed:  { label: "Reimbursed",  className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export function ExpenseStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
