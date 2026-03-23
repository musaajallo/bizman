import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  on_leave: { label: "On Leave", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  terminated: { label: "Terminated", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  resigned: { label: "Resigned", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  study: "Study Leave",
  unpaid: "Unpaid Leave",
  compassionate: "Compassionate Leave",
};

interface Props {
  status: string;
  leaveType?: string | null;
}

export function EmployeeStatusBadge({ status, leaveType }: Props) {
  const config = statusConfig[status] ?? statusConfig.active;
  const label = status === "on_leave" && leaveType
    ? leaveTypeLabels[leaveType] ?? config.label
    : config.label;

  return (
    <Badge variant="outline" className={config.className}>
      {label}
    </Badge>
  );
}
