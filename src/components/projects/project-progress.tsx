export function ProjectProgress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-mono w-8 text-right">{value}%</span>
    </div>
  );
}
