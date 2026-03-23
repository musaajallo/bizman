"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./status-badge";
import { PriorityIndicator } from "./priority-indicator";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, ChevronRight } from "lucide-react";

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  group: string;
}

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    priority: string;
    status: TaskStatus;
    assignee: { id: string; name: string | null; image: string | null } | null;
    dueDate: Date | string | null;
    _count: { subtasks: number };
  };
  statuses: TaskStatus[];
  onDeleted?: () => void;
  onClick?: () => void;
}

export function TaskRow({ task, statuses, onDeleted, onClick }: TaskRowProps) {
  const initials = task.assignee?.name
    ? task.assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status.group !== "done" &&
    task.status.group !== "closed";

  async function handleStatusChange(value: string | null) {
    if (value) await updateTaskStatus(task.id, value);
  }

  async function handleDelete() {
    await deleteTask(task.id);
    onDeleted?.();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/50 group cursor-pointer" onClick={onClick}>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm truncate">{task.title}</span>
        {task._count.subtasks > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <ChevronRight className="h-3 w-3" />
            {task._count.subtasks}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Select
          value={task.status.id}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="h-7 w-auto border-0 p-0 shadow-none hover:bg-transparent focus:ring-0">
            <StatusBadge name={task.status.name} color={task.status.color} />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <StatusBadge name={s.name} color={s.color} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <PriorityIndicator priority={task.priority} />

        {initials ? (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-6 w-6" />
        )}

        {dueDate && (
          <span
            className={`text-xs font-mono w-16 text-right ${
              isOverdue ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {dueDate}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
