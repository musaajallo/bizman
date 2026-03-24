import { Badge } from "@/components/ui/badge";

export function ExpenseCategoryBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="text-xs font-medium text-muted-foreground border-border/60">
      {label}
    </Badge>
  );
}
