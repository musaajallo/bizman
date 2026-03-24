import { Badge } from "@/components/ui/badge";
import { REQUISITION_STATUSES, PO_STATUSES, REQUISITION_PRIORITIES } from "@/lib/procurement-constants";
import { cn } from "@/lib/utils";

export function RequisitionStatusBadge({ status }: { status: string }) {
  const cfg = REQUISITION_STATUSES[status as keyof typeof REQUISITION_STATUSES];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>;
}

export function PoStatusBadge({ status }: { status: string }) {
  const cfg = PO_STATUSES[status as keyof typeof PO_STATUSES];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = REQUISITION_PRIORITIES[priority as keyof typeof REQUISITION_PRIORITIES];
  if (!cfg) return <Badge variant="outline">{priority}</Badge>;
  return <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>;
}
