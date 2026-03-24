import { Badge } from "@/components/ui/badge";

const CONFIG: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  inactive: { label: "Inactive", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export function VendorStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? CONFIG.inactive;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
