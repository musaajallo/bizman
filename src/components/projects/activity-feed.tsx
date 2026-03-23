"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FolderPlus,
  UserPlus,
  UserMinus,
  ListPlus,
  ListChecks,
  ArrowRightLeft,
  Trash2,
  Flag,
  Settings,
  Activity,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  details: unknown;
  createdAt: Date | string;
  actor: { id: string; name: string | null; image: string | null };
}

const ACTION_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: (d: Record<string, unknown> | null) => string }
> = {
  created_project: {
    icon: FolderPlus,
    color: "text-blue-500",
    label: () => "created this project",
  },
  updated_project: {
    icon: Settings,
    color: "text-muted-foreground",
    label: (d) => {
      if (d?.field) return `updated ${d.field as string}`;
      return "updated project settings";
    },
  },
  updated_status: {
    icon: ArrowRightLeft,
    color: "text-amber-500",
    label: (d) =>
      d?.from && d?.to
        ? `changed status from ${d.from as string} to ${d.to as string}`
        : "changed project status",
  },
  added_member: {
    icon: UserPlus,
    color: "text-emerald-500",
    label: (d) =>
      d?.memberName
        ? `added ${d.memberName as string} as ${d.role as string ?? "member"}`
        : "added a team member",
  },
  removed_member: {
    icon: UserMinus,
    color: "text-red-400",
    label: (d) =>
      d?.memberName ? `removed ${d.memberName as string}` : "removed a team member",
  },
  created_task: {
    icon: ListPlus,
    color: "text-blue-400",
    label: (d) =>
      d?.taskTitle ? `created task "${d.taskTitle as string}"` : "created a task",
  },
  completed_task: {
    icon: ListChecks,
    color: "text-emerald-500",
    label: (d) =>
      d?.taskTitle ? `completed "${d.taskTitle as string}"` : "completed a task",
  },
  updated_task_status: {
    icon: ArrowRightLeft,
    color: "text-amber-400",
    label: (d) =>
      d?.taskTitle
        ? `moved "${d.taskTitle as string}" from ${d.from as string} to ${d.to as string}`
        : "updated task status",
  },
  deleted_task: {
    icon: Trash2,
    color: "text-red-400",
    label: (d) =>
      d?.taskTitle ? `deleted task "${d.taskTitle as string}"` : "deleted a task",
  },
  created_milestone: {
    icon: Flag,
    color: "text-purple-500",
    label: (d) =>
      d?.milestoneName
        ? `created milestone "${d.milestoneName as string}"`
        : "created a milestone",
  },
  completed_milestone: {
    icon: Flag,
    color: "text-emerald-500",
    label: (d) =>
      d?.milestoneName
        ? `completed milestone "${d.milestoneName as string}"`
        : "completed a milestone",
  },
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const config = ACTION_CONFIG[activity.action] ?? {
          icon: Activity,
          color: "text-muted-foreground",
          label: () => activity.action.replace(/_/g, " "),
        };
        const Icon = config.icon;
        const details = (activity.details && typeof activity.details === "object" && !Array.isArray(activity.details))
          ? activity.details as Record<string, unknown>
          : null;
        const isLast = idx === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div className={`shrink-0 mt-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center z-10 ${config.color}`}>
              <Icon className="h-3 w-3" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium">
                  {activity.actor.name ?? "Someone"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {config.label(details)}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {timeAgo(activity.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
