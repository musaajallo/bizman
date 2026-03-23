import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  on_leave: { label: "On Leave", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  terminated: { label: "Terminated", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

export function EmployeeStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.active;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
