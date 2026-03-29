"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createMilestone,
  deleteMilestone,
  updateMilestone,
  triggerMilestonePayment,
} from "@/lib/actions/milestones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  Flag,
  Calendar,
  DollarSign,
  Zap,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { MilestonePaymentDialog } from "./milestone-payment-dialog";
import Link from "next/link";

interface PaymentData {
  amount: { toString(): string } | number | string;
  currency: string;
  description: string | null;
  triggerType: string;
  invoiceId: string | null;
  triggeredAt: Date | string | null;
  invoice: { id: string; invoiceNumber: string; status: string } | null;
}

interface MilestoneData {
  id: string;
  name: string;
  description: string | null;
  dueDate: Date | string | null;
  status: string;
  completed: boolean;
  completedAt: Date | string | null;
  payment?: PaymentData | null;
  _count?: { tasks: number };
}

interface MilestoneListProps {
  projectId: string;
  milestones: MilestoneData[];
  completedTaskCountByMilestone?: Record<string, number>;
  onUpdated: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  not_started: { label: "Not Started", icon: <Circle className="h-3.5 w-3.5" />, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: <Clock className="h-3.5 w-3.5" />, color: "text-blue-500" },
  completed:   { label: "Completed",   icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-500" },
  delayed:     { label: "Delayed",     icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-500" },
};

const INVOICE_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  paid: "default",
  void: "destructive",
  overdue: "destructive",
};

function MilestoneRow({
  milestone,
  completedTaskCount,
  onUpdated,
}: {
  milestone: MilestoneData;
  completedTaskCount: number;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(milestone.name);
  const [dueDate, setDueDate] = useState(
    milestone.dueDate ? new Date(milestone.dueDate).toISOString().split("T")[0] : ""
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const isOverdue = milestone.dueDate && !milestone.completed && new Date(milestone.dueDate) < new Date();
  const statusCfg = STATUS_CONFIG[milestone.status] ?? STATUS_CONFIG.not_started;
  const totalTasks = milestone._count?.tasks ?? 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;

  const payment = milestone.payment;
  const hasActiveInvoice = payment?.invoiceId && payment.invoice?.status !== "void";
  const canTrigger = payment && (!payment.invoiceId || payment.invoice?.status === "void");

  async function handleSave() {
    await updateMilestone(milestone.id, { name, dueDate: dueDate || undefined });
    setEditing(false);
    onUpdated();
  }

  async function handleDelete() {
    await deleteMilestone(milestone.id);
    onUpdated();
  }

  async function handleStatusChange(status: string) {
    await updateMilestone(milestone.id, { status });
    onUpdated();
  }

  async function handleTriggerPayment() {
    setTriggering(true);
    setTriggerError(null);
    const result = await triggerMilestonePayment(milestone.id);
    setTriggering(false);
    if ("error" in result) {
      setTriggerError(result.error ?? "Failed to trigger invoice");
    } else {
      onUpdated();
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 text-sm w-36"
        />
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    );
  }

  return (
    <>
      <div className="py-3 group space-y-2">
        {/* Top row: flag + name + status + date + menu */}
        <div className="flex items-center gap-2.5">
          <Flag className={`h-3.5 w-3.5 shrink-0 ${statusCfg.color}`} />

          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
              {milestone.name}
            </span>
            {milestone.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{milestone.description}</p>
            )}
          </div>

          <div className={`flex items-center gap-1 text-xs shrink-0 ${statusCfg.color}`}>
            {statusCfg.icon}
            <span className="hidden sm:inline">{statusCfg.label}</span>
          </div>

          {milestone.dueDate && (
            <span className={`text-xs font-mono shrink-0 flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
              <Calendar className="h-3 w-3" />
              {new Date(milestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={milestone.status === key ? "bg-accent" : ""}
                >
                  <span className={`mr-2 ${cfg.color}`}>{cfg.icon}</span>
                  {cfg.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPaymentDialogOpen(true)}>
                <DollarSign className="h-3.5 w-3.5 mr-2" />
                {payment ? "Edit Payment" : "Add Payment Trigger"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task progress bar */}
        {totalTasks > 0 && (
          <div className="flex items-center gap-2 ml-6 text-xs text-muted-foreground">
            <span className="shrink-0">{completedTaskCount}/{totalTasks} tasks</span>
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="shrink-0">{progressPct}%</span>
          </div>
        )}

        {/* Payment section */}
        {payment && (
          <div className="ml-6 flex items-center gap-2 flex-wrap">
            {hasActiveInvoice && payment.invoice ? (
              <>
                <Badge variant={INVOICE_STATUS_VARIANT[payment.invoice.status] ?? "outline"} className="text-xs capitalize">
                  {payment.invoice.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{payment.currency} {parseFloat(payment.amount.toString()).toLocaleString()}</span>
                <Link
                  href={`/africs/accounting/invoices/${payment.invoice.id}`}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  {payment.invoice.invoiceNumber}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">
                  {payment.currency} {parseFloat(payment.amount.toString()).toLocaleString()} payment pending
                  {payment.triggerType === "on_completion" && " · auto on completion"}
                </span>
                {payment.triggerType === "manual" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1 px-2"
                    onClick={handleTriggerPayment}
                    disabled={triggering}
                  >
                    <Zap className="h-3 w-3" />
                    {triggering ? "Triggering..." : "Trigger Invoice"}
                  </Button>
                )}
                {triggerError && <span className="text-xs text-destructive">{triggerError}</span>}
              </>
            )}
          </div>
        )}

        {!payment && (
          <div className="ml-6">
            <button
              onClick={() => setPaymentDialogOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <DollarSign className="h-3 w-3" />
              Add payment trigger
            </button>
          </div>
        )}
      </div>

      <MilestonePaymentDialog
        milestoneId={milestone.id}
        milestoneName={milestone.name}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        existing={payment}
        onSaved={onUpdated}
      />
    </>
  );
}

export function MilestoneList({
  projectId,
  milestones,
  completedTaskCountByMilestone = {},
  onUpdated,
}: MilestoneListProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    await createMilestone(projectId, {
      name: newName.trim(),
      dueDate: newDueDate || undefined,
    });
    setNewName("");
    setNewDueDate("");
    setAdding(false);
    setSubmitting(false);
    onUpdated();
  }

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>{completed}/{total} completed</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span>{pct}%</span>
        </div>
      )}

      <div className="divide-y">
        {milestones.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            completedTaskCount={completedTaskCountByMilestone[m.id] ?? 0}
            onUpdated={onUpdated}
          />
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Milestone name..."
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="h-8 text-sm w-36"
          />
          <Button size="sm" onClick={handleAdd} disabled={submitting || !newName.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Milestone
        </Button>
      )}
    </div>
  );
}
