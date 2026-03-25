"use client";

import { Button } from "@/components/ui/button";
import { List, LayoutGrid, CalendarDays, BarChart3, GanttChart, Clock, SquareStack } from "lucide-react";
import Link from "next/link";

interface ViewSwitcherProps {
  currentView: "cards" | "list" | "board" | "calendar" | "overview" | "timeline" | "time";
  baseUrl: string;
  showCards?: boolean;
  showCalendar?: boolean;
  showOverview?: boolean;
  showTimeline?: boolean;
  showTime?: boolean;
}

export function ViewSwitcher({
  currentView,
  baseUrl,
  showCards = false,
  showCalendar = false,
  showOverview = false,
  showTimeline = false,
  showTime = false,
}: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-md border bg-muted/50 p-0.5">
      {showCards && (
        <Link href={baseUrl}>
          <Button
            size="sm"
            variant={currentView === "cards" ? "secondary" : "ghost"}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <SquareStack className="h-3.5 w-3.5" />
            Cards
          </Button>
        </Link>
      )}
      <Link href={showCards ? `${baseUrl}?view=list` : baseUrl}>
        <Button
          size="sm"
          variant={currentView === "list" ? "secondary" : "ghost"}
          className="h-7 px-2.5 gap-1.5 text-xs"
        >
          <List className="h-3.5 w-3.5" />
          List
        </Button>
      </Link>
      <Link href={`${baseUrl}/board`}>
        <Button
          size="sm"
          variant={currentView === "board" ? "secondary" : "ghost"}
          className="h-7 px-2.5 gap-1.5 text-xs"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Board
        </Button>
      </Link>
      {showTimeline && (
        <Link href={`${baseUrl}/timeline`}>
          <Button
            size="sm"
            variant={currentView === "timeline" ? "secondary" : "ghost"}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <GanttChart className="h-3.5 w-3.5" />
            Timeline
          </Button>
        </Link>
      )}
      {showCalendar && (
        <Link href={`${baseUrl}/calendar`}>
          <Button
            size="sm"
            variant={currentView === "calendar" ? "secondary" : "ghost"}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </Button>
        </Link>
      )}
      {showTime && (
        <Link href={`${baseUrl}/time`}>
          <Button
            size="sm"
            variant={currentView === "time" ? "secondary" : "ghost"}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <Clock className="h-3.5 w-3.5" />
            Time
          </Button>
        </Link>
      )}
      {showOverview && (
        <Link href={`${baseUrl}/overview`}>
          <Button
            size="sm"
            variant={currentView === "overview" ? "secondary" : "ghost"}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </Button>
        </Link>
      )}
    </div>
  );
}
