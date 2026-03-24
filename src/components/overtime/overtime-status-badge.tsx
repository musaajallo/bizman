import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const labels: Record<string, string> = {
  pending:  "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function OvertimeStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={styles[status] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
      {labels[status] ?? status}
    </Badge>
  );
}
