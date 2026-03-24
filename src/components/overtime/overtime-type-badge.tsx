import { Badge } from "@/components/ui/badge";
import { OVERTIME_TYPES } from "@/lib/overtime-constants";

const styles: Record<string, string> = {
  standard: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  weekend:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  holiday:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function OvertimeTypeBadge({ overtimeType }: { overtimeType: string }) {
  const label = OVERTIME_TYPES.find((t) => t.value === overtimeType)?.label ?? overtimeType;
  return (
    <Badge variant="outline" className={styles[overtimeType] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
      {label}
    </Badge>
  );
}
