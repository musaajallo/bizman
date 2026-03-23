"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface TimelineTask {
  id: string;
  title: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  priority: string;
  status: { name: string; color: string; group: string };
  assignee: { id: string; name: string | null; image: string | null } | null;
  blockedBy?: { dependsOn: { id: string } }[];
  blocking?: { task: { id: string } }[];
}

interface Props {
  tasks: TimelineTask[];
  onTaskClick?: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-500",
  low: "bg-gray-400",
  none: "bg-gray-300",
};

const DAY_WIDTH = 32;
const ROW_HEIGHT = 36;

function toDate(d: Date | string | null): Date | null {
  if (!d) return null;
  return new Date(d);
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (86400000));
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function TaskTimeline({ tasks, onTaskClick }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { startDate, endDate, totalDays, weeks } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Start from the beginning of the current week + offset
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7);

    // Show 8 weeks
    const end = addDays(start, 56);
    const total = daysBetween(start, end);

    const wks: { start: Date; label: string }[] = [];
    for (let i = 0; i < 8; i++) {
      const ws = addDays(start, i * 7);
      wks.push({
        start: ws,
        label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }

    return { startDate: start, endDate: end, totalDays: total, weeks: wks };
  }, [weekOffset]);

  // Sort tasks: those with dates first, then by start date
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter((t) => t.startDate || t.dueDate)
      .sort((a, b) => {
        const aStart = toDate(a.startDate) ?? toDate(a.dueDate)!;
        const bStart = toDate(b.startDate) ?? toDate(b.dueDate)!;
        return aStart.getTime() - bStart.getTime();
      });
  }, [tasks]);

  const unscheduled = tasks.filter((t) => !t.startDate && !t.dueDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(startDate, today);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o - 4)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o + 4)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {sortedTasks.length} scheduled, {unscheduled.length} unscheduled
        </p>
      </div>

      {/* Gantt area */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${250 + totalDays * DAY_WIDTH}px` }}>
            {/* Week headers */}
            <div className="flex border-b bg-muted/50">
              <div className="w-[250px] shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r">
                Task
              </div>
              <div className="flex-1 flex relative">
                {weeks.map((week, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground py-2 border-r border-dashed"
                    style={{ width: `${7 * DAY_WIDTH}px`, paddingLeft: 4 }}
                  >
                    {week.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            {sortedTasks.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                No tasks with dates. Set start/due dates to see them here.
              </div>
            ) : (
              sortedTasks.map((task) => {
                const tStart = toDate(task.startDate) ?? toDate(task.dueDate)!;
                const tEnd = toDate(task.dueDate) ?? tStart;
                const left = Math.max(0, daysBetween(startDate, tStart));
                const duration = Math.max(1, daysBetween(tStart, tEnd) + 1);
                const isDone = task.completedAt !== null;

                return (
                  <div
                    key={task.id}
                    className="flex border-b last:border-b-0 hover:bg-muted/30 cursor-pointer group"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onTaskClick?.(task.id)}
                  >
                    {/* Task label */}
                    <div className="w-[250px] shrink-0 px-3 flex items-center gap-2 border-r overflow-hidden">
                      {task.assignee && (
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarFallback className="text-[8px]">
                            {(task.assignee.name ?? "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className={`text-xs truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative">
                      {/* Today line */}
                      {todayOffset >= 0 && todayOffset <= totalDays && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-500/50 z-10"
                          style={{ left: `${todayOffset * DAY_WIDTH}px` }}
                        />
                      )}

                      {/* Task bar */}
                      <div
                        className={`absolute top-1.5 rounded-sm h-5 flex items-center px-1.5 text-[10px] text-white font-medium truncate ${
                          isDone ? "opacity-50" : ""
                        } ${PRIORITY_COLORS[task.priority] || "bg-blue-500"}`}
                        style={{
                          left: `${left * DAY_WIDTH}px`,
                          width: `${Math.max(duration * DAY_WIDTH, DAY_WIDTH)}px`,
                        }}
                      >
                        <span className="truncate">{task.title}</span>
                      </div>

                      {/* Dependency arrows (simple) */}
                      {task.blockedBy?.map((dep) => {
                        const blockingTask = sortedTasks.find((t) => t.id === dep.dependsOn.id);
                        if (!blockingTask) return null;
                        const bEnd = toDate(blockingTask.dueDate) ?? toDate(blockingTask.startDate);
                        if (!bEnd) return null;
                        const arrowLeft = daysBetween(startDate, bEnd) * DAY_WIDTH + DAY_WIDTH;
                        return (
                          <div
                            key={dep.dependsOn.id}
                            className="absolute"
                            style={{ left: `${arrowLeft}px`, top: ROW_HEIGHT / 2 - 4 }}
                          >
                            <ArrowRight className="h-3 w-3 text-amber-500" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Unscheduled ({unscheduled.length})</p>
          <div className="flex flex-wrap gap-1">
            {unscheduled.slice(0, 10).map((task) => (
              <Badge
                key={task.id}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => onTaskClick?.(task.id)}
              >
                {task.title}
              </Badge>
            ))}
            {unscheduled.length > 10 && (
              <Badge variant="secondary" className="text-xs">
                +{unscheduled.length - 10} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
