import { Check } from "lucide-react";

interface Props {
  status: string;
}

const steps = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "paid", label: "Paid" },
];

const statusOrder: Record<string, number> = {
  draft: 0,
  sent: 1,
  viewed: 2,
  paid: 3,
  overdue: 2, // Same visual position as viewed
  void: -1,
};

export function InvoiceStatusFlow({ status }: Props) {
  if (status === "void") {
    return (
      <div className="flex items-center justify-center py-2">
        <span className="text-sm text-zinc-500 line-through">This invoice has been voided</span>
      </div>
    );
  }

  const currentIndex = statusOrder[status] ?? 0;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex || (index === currentIndex && status === step.key);
        const isCurrent = index === currentIndex;
        const isOverdue = status === "overdue" && index === 2;

        return (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isOverdue
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted && !isCurrent ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={`text-[10px] ${
                isOverdue ? "text-red-400 font-medium" :
                isCompleted || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>
                {isOverdue ? "Overdue" : step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-px flex-1 mb-4 ${
                index < currentIndex ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
