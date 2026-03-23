"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarTask {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | string | null;
  status: { name: string; color: string; group: string };
}

interface TaskCalendarProps {
  tasks: CalendarTask[];
  onTaskClick?: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
  none: "border-l-muted-foreground",
};

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // Group tasks by day
  const tasksByDay: Record<number, CalendarTask[]> = {};
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const d = new Date(task.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(task);
    }
  }

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium w-40 text-center">{monthLabel}</h3>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={goToday}>
          Today
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs text-muted-foreground font-medium text-center py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border-l border-r">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b">
            {week.map((day, di) => {
              const dayTasks = day ? tasksByDay[day] ?? [] : [];
              return (
                <div
                  key={di}
                  className={`min-h-[90px] p-1 border-r last:border-r-0 ${
                    day === null ? "bg-muted/20" : ""
                  }`}
                >
                  {day !== null && (
                    <>
                      <span
                        className={`text-xs inline-flex items-center justify-center h-5 w-5 rounded-full ${
                          isToday(day)
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`text-[10px] leading-tight px-1 py-0.5 rounded-sm bg-muted/60 border-l-2 truncate cursor-pointer hover:bg-muted ${
                              PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.none
                            }`}
                            title={task.title}
                            onClick={() => onTaskClick?.(task.id)}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[10px] text-muted-foreground px-1">
                            +{dayTasks.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
