"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Link2, X, AlertCircle } from "lucide-react";
import {
  getTaskDependencies,
  addDependency,
  removeDependency,
  getAvailableDependencies,
} from "@/lib/actions/task-dependencies";

interface TaskDep {
  id: string;
  title: string;
  completedAt: Date | string | null;
  status: { name: string; color: string; group: string };
}

interface Props {
  taskId: string;
  projectId: string;
  onUpdated?: () => void;
}

export function TaskDependencies({ taskId, projectId, onUpdated }: Props) {
  const [blockedBy, setBlockedBy] = useState<{ id: string; dependsOn: TaskDep }[]>([]);
  const [blocking, setBlocking] = useState<{ id: string; task: TaskDep }[]>([]);
  const [available, setAvailable] = useState<{ id: string; title: string; status: { name: string; color: string } }[]>([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [deps, avail] = await Promise.all([
      getTaskDependencies(taskId),
      getAvailableDependencies(projectId, taskId),
    ]);
    setBlockedBy(deps.blockedBy as typeof blockedBy);
    setBlocking(deps.blocking as typeof blocking);
    // Filter out already linked tasks
    const linkedIds = new Set([
      ...deps.blockedBy.map((d: { dependsOnId: string }) => d.dependsOnId),
      ...deps.blocking.map((d: { taskId: string }) => d.taskId),
    ]);
    setAvailable(avail.filter((t) => !linkedIds.has(t.id)));
  };

  useEffect(() => { load(); }, [taskId, projectId]);

  const handleAdd = async () => {
    if (!selectedTask) return;
    setAdding(true);
    setError("");
    const result = await addDependency(taskId, selectedTask);
    if (result.error) {
      setError(result.error);
    } else {
      setSelectedTask("");
      await load();
      onUpdated?.();
    }
    setAdding(false);
  };

  const handleRemove = async (dependsOnId: string) => {
    await removeDependency(taskId, dependsOnId);
    await load();
    onUpdated?.();
  };

  const handleRemoveBlocking = async (blockedTaskId: string) => {
    await removeDependency(blockedTaskId, taskId);
    await load();
    onUpdated?.();
  };

  return (
    <div className="space-y-4">
      {/* Blocked by */}
      {blockedBy.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blocked by</p>
          {blockedBy.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 text-sm">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: dep.dependsOn.status.color }}
              />
              <span className={dep.dependsOn.completedAt ? "line-through text-muted-foreground" : ""}>
                {dep.dependsOn.title}
              </span>
              <Badge variant="outline" className="text-[10px] ml-auto">
                {dep.dependsOn.status.name}
              </Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemove(dep.dependsOn.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Blocking */}
      {blocking.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blocking</p>
          {blocking.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
              <span>{dep.task.title}</span>
              <Badge variant="outline" className="text-[10px] ml-auto">
                {dep.task.status.name}
              </Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveBlocking(dep.task.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add dependency */}
      <div className="flex items-center gap-2">
        <Select value={selectedTask} onValueChange={(v) => { if (v) setSelectedTask(v); }}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="Add dependency..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.status.color }} />
                  {t.title}
                </div>
              </SelectItem>
            ))}
            {available.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No tasks available</div>
            )}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleAdd} disabled={!selectedTask || adding}>
          <Link2 className="h-3 w-3" />
          Add
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
