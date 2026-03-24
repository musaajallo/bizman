import { Badge } from "@/components/ui/badge";
import { ASSET_STATUSES, ASSET_CONDITIONS, MAINTENANCE_STATUSES } from "@/lib/asset-constants";
import { cn } from "@/lib/utils";

export function AssetStatusBadge({ status }: { status: string }) {
  const cfg = ASSET_STATUSES[status as keyof typeof ASSET_STATUSES];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>;
}

export function AssetConditionBadge({ condition }: { condition: string }) {
  const cfg = ASSET_CONDITIONS[condition as keyof typeof ASSET_CONDITIONS];
  if (!cfg) return <Badge variant="outline">{condition}</Badge>;
  return <Badge variant="outline" className={cn("text-xs border-border", cfg.color)}>{cfg.label}</Badge>;
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  const cfg = MAINTENANCE_STATUSES[status as keyof typeof MAINTENANCE_STATUSES];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>;
}
