"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Plus, Trash2, Timer } from "lucide-react";
import { getTimeEntries, logTime, deleteTimeEntry } from "@/lib/actions/time-entries";

interface TimeEntryData {
  id: string;
  minutes: number;
  description: string | null;
  date: Date | string;
  userId: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Props {
  taskId: string;
  estimateMinutes: number | null;
  loggedMinutes: number;
  currentUserId: string;
  onUpdated?: () => void;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TimeTracker({ taskId, estimateMinutes, loggedMinutes, currentUserId, onUpdated }: Props) {
  const [entries, setEntries] = useState<TimeEntryData[]>([]);
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await getTimeEntries(taskId);
    setEntries(data as unknown as TimeEntryData[]);
  };

  useEffect(() => { load(); }, [taskId]);

  const handleLog = async () => {
    const totalMins = (parseInt(hours || "0") * 60) + parseInt(mins || "0");
    if (totalMins <= 0) return;
    setSaving(true);
    await logTime(taskId, totalMins, description || undefined);
    setHours("");
    setMins("");
    setDescription("");
    await load();
    onUpdated?.();
    setSaving(false);
  };

  const handleDelete = async (entryId: string) => {
    await deleteTimeEntry(entryId);
    await load();
    onUpdated?.();
  };

  const progress = estimateMinutes && estimateMinutes > 0
    ? Math.min(100, Math.round((loggedMinutes / estimateMinutes) * 100))
    : null;
  const overBudget = estimateMinutes ? loggedMinutes > estimateMinutes : false;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{formatDuration(loggedMinutes)}</span>
          <span className="text-xs text-muted-foreground">logged</span>
        </div>
        {estimateMinutes && (
          <>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-sm">{formatDuration(estimateMinutes)} est.</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className={`text-[10px] ${overBudget ? "text-red-500" : "text-muted-foreground"}`}>
            {progress}% of estimate{overBudget && " (over budget!)"}
          </p>
        </div>
      )}

      {/* Log time form */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="h-8 w-14 text-xs"
            />
            <span className="text-xs text-muted-foreground">h</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              className="h-8 w-14 text-xs"
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleLog} disabled={saving}>
            <Plus className="h-3 w-3" />
            Log
          </Button>
        </div>
        <Input
          placeholder="What did you work on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-8 text-xs"
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
        />
      </div>

      {/* Entry list */}
      {entries.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 py-1.5 text-xs group">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[8px]">
                  {(entry.user.name ?? "?")[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-mono font-medium w-12">
                {formatDuration(entry.minutes)}
              </span>
              <span className="text-muted-foreground truncate flex-1">
                {entry.description || "No description"}
              </span>
              <span className="text-muted-foreground shrink-0">
                {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              {entry.user.id === currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
