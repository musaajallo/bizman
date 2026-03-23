"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, CheckSquare, Trash2, ArrowRightLeft, UserPlus, Calendar, Flag } from "lucide-react";
import {
  bulkUpdateTaskStatus,
  bulkUpdateTaskPriority,
  bulkAssignTasks,
  bulkDeleteTasks,
  bulkSetDueDate,
} from "@/lib/actions/bulk-operations";

interface Status {
  id: string;
  name: string;
  color: string;
}

interface Member {
  id: string;
  name: string | null;
}

interface Props {
  selectedIds: string[];
  statuses: Status[];
  members: Member[];
  onClear: () => void;
  onUpdated: () => void;
}

export function BulkActionsBar({ selectedIds, statuses, members, onClear, onUpdated }: Props) {
  const [acting, setActing] = useState(false);

  if (selectedIds.length === 0) return null;

  const act = async (fn: () => Promise<unknown>) => {
    setActing(true);
    await fn();
    onClear();
    onUpdated();
    setActing(false);
  };

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-3xl">
      <div className="flex items-center gap-2 p-3 bg-background border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span>{selectedIds.length} selected</span>
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Status */}
        <Select
          disabled={acting}
          onValueChange={(statusId: string | null) => { if (statusId) act(() => bulkUpdateTaskStatus(selectedIds, statusId)); }}
        >
          <SelectTrigger className="h-8 w-auto gap-1 text-xs">
            <ArrowRightLeft className="h-3 w-3" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select
          disabled={acting}
          onValueChange={(priority: string | null) => { if (priority) act(() => bulkUpdateTaskPriority(selectedIds, priority)); }}
        >
          <SelectTrigger className="h-8 w-auto gap-1 text-xs">
            <Flag className="h-3 w-3" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {["urgent", "high", "medium", "low", "none"].map((p) => (
              <SelectItem key={p} value={p} className="text-xs capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee */}
        <Select
          disabled={acting}
          onValueChange={(assigneeId: string | null) => {
            if (assigneeId) act(() => bulkAssignTasks(selectedIds, assigneeId === "unassign" ? null : assigneeId));
          }}
        >
          <SelectTrigger className="h-8 w-auto gap-1 text-xs">
            <UserPlus className="h-3 w-3" />
            <SelectValue placeholder="Assign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassign" className="text-xs">Unassign</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.name ?? "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Due date */}
        <Input
          type="date"
          className="h-8 w-auto text-xs"
          disabled={acting}
          onChange={(e) => {
            if (e.target.value) act(() => bulkSetDueDate(selectedIds, e.target.value));
          }}
        />

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="h-8 gap-1 ml-auto"
          disabled={acting}
          onClick={() => {
            if (confirm(`Delete ${selectedIds.length} tasks?`)) {
              act(() => bulkDeleteTasks(selectedIds));
            }
          }}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
