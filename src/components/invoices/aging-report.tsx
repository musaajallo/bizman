interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
}

interface Props {
  buckets: AgingBuckets;
  currency: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

const BUCKET_CONFIG = [
  { key: "current" as const, label: "Current", color: "bg-emerald-500" },
  { key: "days1to30" as const, label: "1-30 days", color: "bg-amber-500" },
  { key: "days31to60" as const, label: "31-60 days", color: "bg-orange-500" },
  { key: "days61to90" as const, label: "61-90 days", color: "bg-red-400" },
  { key: "days90plus" as const, label: "90+ days", color: "bg-red-600" },
];

export function AgingReport({ buckets, currency }: Props) {
  const total = Object.values(buckets).reduce((sum, v) => sum + v, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No outstanding invoices
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {BUCKET_CONFIG.map(({ key, color }) => {
          const pct = (buckets[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`${color} transition-all`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5">
        {BUCKET_CONFIG.map(({ key, label, color }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
            <span className="font-mono text-xs">{formatCurrency(buckets[key], currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm pt-1.5 border-t">
          <span className="font-medium">Total Outstanding</span>
          <span className="font-mono text-xs font-medium">{formatCurrency(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
