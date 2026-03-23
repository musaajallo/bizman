"use client";

interface MonthlyData {
  month: string;
  invoiced: number;
  paid: number;
}

interface Props {
  data: MonthlyData[];
  currency: string;
}

function formatCompact(amount: number, currency: string) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function RevenueChart({ data, currency }: Props) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.invoiced, d.paid)), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/70" />
          <span>Invoiced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
          <span>Paid</span>
        </div>
      </div>

      <div className="flex items-end gap-1 h-40">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5 group">
            <div className="w-full flex items-end gap-px h-32">
              <div className="flex-1 flex flex-col justify-end">
                <div
                  className="bg-primary/70 rounded-t-sm min-h-[2px] transition-all group-hover:bg-primary"
                  style={{ height: `${(d.invoiced / maxValue) * 100}%` }}
                  title={`Invoiced: ${formatCompact(d.invoiced, currency)}`}
                />
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <div
                  className="bg-emerald-500/70 rounded-t-sm min-h-[2px] transition-all group-hover:bg-emerald-500"
                  style={{ height: `${(d.paid / maxValue) * 100}%` }}
                  title={`Paid: ${formatCompact(d.paid, currency)}`}
                />
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
