import { Badge } from "@/components/ui/badge";

const runConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  processing: { label: "Processing", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const payslipConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  processed: { label: "Processed", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export function PayrollStatusBadge({ status, type = "run" }: { status: string; type?: "run" | "payslip" }) {
  const map = type === "payslip" ? payslipConfig : runConfig;
  const cfg = map[status] ?? runConfig.draft;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
