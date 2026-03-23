import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  name: string;
  color: string;
}

export function StatusBadge({ name, color }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {name}
    </Badge>
  );
}
