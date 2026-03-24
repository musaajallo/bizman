import { Badge } from "@/components/ui/badge";

const typeConfig: Record<string, { label: string; className: string }> = {
  annual: { label: "Annual", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  sick: { label: "Sick", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  maternity: { label: "Maternity", className: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  paternity: { label: "Paternity", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  study: { label: "Study", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  unpaid: { label: "Unpaid", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  compassionate: { label: "Compassionate", className: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
};

export function LeaveTypeBadge({ leaveType }: { leaveType: string }) {
  const cfg = typeConfig[leaveType] ?? { label: leaveType, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
