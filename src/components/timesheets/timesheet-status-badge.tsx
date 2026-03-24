import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft:     { label: "Draft",    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  submitted: { label: "Pending",  className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved:  { label: "Approved", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected:  { label: "Rejected", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function TimesheetStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", s.className)}>
      {s.label}
    </span>
  );
}
