import { cn } from "@/lib/utils";

const CATEGORY_MAP: Record<string, { label: string; className: string }> = {
  work:     { label: "Work",     className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  meeting:  { label: "Meeting",  className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  training: { label: "Training", className: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  admin:    { label: "Admin",    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  travel:   { label: "Travel",   className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  sick:     { label: "Sick",     className: "bg-red-500/10 text-red-400 border-red-500/20" },
  other:    { label: "Other",    className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export function TimesheetCategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_MAP[category] ?? { label: category, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border", c.className)}>
      {c.label}
    </span>
  );
}
