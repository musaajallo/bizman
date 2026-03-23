import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";

const priorities: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  urgent: { icon: AlertTriangle, color: "text-red-500", label: "Urgent" },
  high: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  medium: { icon: Minus, color: "text-yellow-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
  none: { icon: Minus, color: "text-muted-foreground", label: "None" },
};

export function PriorityIndicator({ priority, showLabel = false }: { priority: string; showLabel?: boolean }) {
  const config = priorities[priority] ?? priorities.medium;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs">{config.label}</span>}
    </span>
  );
}
