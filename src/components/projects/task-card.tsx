"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./status-badge";
import { PriorityIndicator } from "./priority-indicator";
import { MessageSquare, CheckSquare, ChevronRight } from "lucide-react";

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  group: string;
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    priority: string;
    dueDate: Date | string | null;
    assignee: { id: string; name: string | null; image: string | null } | null;
    _count: { subtasks: number; comments: number; checklists: number };
  };
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
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
    task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      className="p-3 bg-card border rounded-lg cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium leading-snug line-clamp-2">
          {task.title}
        </span>
        <PriorityIndicator priority={task.priority} />
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task._count.subtasks > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <ChevronRight className="h-3 w-3" />
              {task._count.subtasks}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
          {task._count.checklists > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <CheckSquare className="h-3 w-3" />
              {task._count.checklists}
            </span>
          )}
          {dueDate && (
            <span className={isOverdue ? "text-red-500" : ""}>
              {dueDate}
            </span>
          )}
        </div>

        {initials && (
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
