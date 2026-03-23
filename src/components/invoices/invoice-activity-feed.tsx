import { FileSpreadsheet, Send, Eye, CreditCard, Ban, Bell, Pencil, Trash2, Mail, RefreshCw } from "lucide-react";

interface Activity {
  id: string;
  action: string;
  details: unknown;
  createdAt: Date | string;
  actor: { id: string; name: string | null } | null;
}

interface Props {
  activities: Activity[];
}

const actionConfig: Record<string, { label: string; icon: typeof FileSpreadsheet; color: string }> = {
  created: { label: "Invoice created", icon: FileSpreadsheet, color: "text-blue-400" },
  updated: { label: "Invoice updated", icon: Pencil, color: "text-zinc-400" },
  sent: { label: "Invoice sent", icon: Send, color: "text-blue-400" },
  viewed: { label: "Invoice viewed by client", icon: Eye, color: "text-amber-400" },
  paid: { label: "Invoice fully paid", icon: CreditCard, color: "text-emerald-400" },
  partially_paid: { label: "Payment recorded", icon: CreditCard, color: "text-emerald-400" },
  voided: { label: "Invoice voided", icon: Ban, color: "text-red-400" },
  reminder_sent: { label: "Reminder sent", icon: Bell, color: "text-amber-400" },
  payment_deleted: { label: "Payment deleted", icon: Trash2, color: "text-red-400" },
  email_sent: { label: "Invoice emailed", icon: Mail, color: "text-blue-400" },
  recurring_set: { label: "Recurring schedule set", icon: RefreshCw, color: "text-purple-400" },
};

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InvoiceActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => {
        const config = actionConfig[activity.action] || {
          label: activity.action,
          icon: FileSpreadsheet,
          color: "text-zinc-400",
        };
        const Icon = config.icon;
        const details = activity.details as { amount?: number; method?: string; to?: string } | null;

        return (
          <div key={activity.id} className="flex gap-3 py-2.5">
            <div className="relative flex flex-col items-center">
              <div className={`h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-sm">
                {config.label}
                {details?.amount != null && (
                  <span className="font-mono ml-1">
                    ({new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 2 }).format(details.amount)})
                  </span>
                )}
                {details?.to && (
                  <span className="text-muted-foreground ml-1">
                    to {details.to}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {activity.actor && (
                  <span className="text-[10px] text-muted-foreground">
                    by {activity.actor.name ?? "Unknown"}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(activity.createdAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
