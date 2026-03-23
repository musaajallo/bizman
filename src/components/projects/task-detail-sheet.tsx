"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { PriorityIndicator } from "./priority-indicator";
import { CommentFeed } from "./comment-feed";
import { Checklist } from "./checklist";
import { TaskDependencies } from "./task-dependencies";
import { TimeTracker } from "./time-tracker";
import { getTaskDetail } from "@/lib/actions/tasks";
import { updateTask, updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import {
  Calendar,
  Clock,
  User,
  ChevronRight,
  Trash2,
  MessageSquare,
  CheckSquare,
  ListTodo,
  FileText,
  Link2,
  Timer,
} from "lucide-react";

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  group: string;
}

interface TaskDetailSheetProps {
  taskId: string | null;
  projectId?: string;
  statuses: TaskStatus[];
  projectMembers: { user: { id: string; name: string | null; image: string | null } }[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

type TaskDetail = Awaited<ReturnType<typeof getTaskDetail>>;

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskDetailSheet({
  taskId,
  projectId,
  statuses,
  projectMembers,
  currentUserId,
  open,
  onOpenChange,
  onUpdated,
}: TaskDetailSheetProps) {
  const [task, setTask] = useState<TaskDetail>(null);
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const t = await getTaskDetail(taskId);
    setTask(t);
    if (t) {
      setTitle(t.title);
      setDescription(t.description ?? "");
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId, loadTask]);

  async function handleStatusChange(value: string | null) {
    if (!task || !value) return;
    await updateTaskStatus(task.id, value);
    loadTask();
    onUpdated?.();
  }

  async function handlePriorityChange(value: string | null) {
    if (!task || !value) return;
    const fd = new FormData();
    fd.set("priority", value);
    await updateTask(task.id, fd);
    loadTask();
    onUpdated?.();
  }

  async function handleAssigneeChange(value: string | null) {
    if (!task) return;
    const fd = new FormData();
    fd.set("assigneeId", value === "unassigned" ? "" : (value ?? ""));
    await updateTask(task.id, fd);
    loadTask();
    onUpdated?.();
  }

  async function handleTitleSave() {
    if (!task || !title.trim()) return;
    const fd = new FormData();
    fd.set("title", title.trim());
    await updateTask(task.id, fd);
    setEditingTitle(false);
    loadTask();
    onUpdated?.();
  }

  async function handleDescSave() {
    if (!task) return;
    const fd = new FormData();
    fd.set("description", description);
    await updateTask(task.id, fd);
    setEditingDesc(false);
    loadTask();
    onUpdated?.();
  }

  async function handleDueDateChange(value: string) {
    if (!task) return;
    const fd = new FormData();
    fd.set("dueDate", value);
    await updateTask(task.id, fd);
    loadTask();
    onUpdated?.();
  }

  async function handleDelete() {
    if (!task) return;
    await deleteTask(task.id);
    onOpenChange(false);
    onUpdated?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto"
      >
        {loading || !task ? (
          <div className="p-4 space-y-4">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b pb-3">
              {/* Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setEditingTitle(false);
                        setTitle(task.title);
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleTitleSave}>
                    Save
                  </Button>
                </div>
              ) : (
                <SheetTitle
                  className="cursor-pointer hover:text-primary transition-colors text-left"
                  onClick={() => setEditingTitle(true)}
                >
                  {task.title}
                </SheetTitle>
              )}
            </SheetHeader>

            {/* Meta bar */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b text-sm">
              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select
                  value={task.status.id}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="h-8">
                    <StatusBadge
                      name={task.status.name}
                      color={task.status.color}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <StatusBadge name={s.name} color={s.color} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={task.priority}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger className="h-8">
                    <PriorityIndicator
                      priority={task.priority}
                      showLabel
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {["urgent", "high", "medium", "low", "none"].map((p) => (
                      <SelectItem key={p} value={p}>
                        <PriorityIndicator priority={p} showLabel />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assignee
                </label>
                <Select
                  value={task.assignee?.id ?? "unassigned"}
                  onValueChange={handleAssigneeChange}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {projectMembers.map((m) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {getInitials(m.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          {m.user.name ?? "Unknown"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due date */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due date
                </label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={
                    task.dueDate
                      ? new Date(task.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleDueDateChange(e.target.value)}
                />
              </div>

              {/* Estimate */}
              {task.estimateMinutes && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Estimate
                  </label>
                  <span className="text-sm">
                    {task.estimateMinutes >= 60
                      ? `${Math.floor(task.estimateMinutes / 60)}h ${task.estimateMinutes % 60}m`
                      : `${task.estimateMinutes}m`}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs: Details, Comments, Checklists */}
            <Tabs defaultValue="details" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-3 w-fit">
                <TabsTrigger value="details" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments
                  {task.comments && task.comments.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {task.comments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="checklists" className="gap-1.5 text-xs">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Checklists
                  {task.checklists && task.checklists.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {task.checklists.length}
                    </Badge>
                  )}
                </TabsTrigger>
                {task.subtasks && task.subtasks.length > 0 && (
                  <TabsTrigger value="subtasks" className="gap-1.5 text-xs">
                    <ListTodo className="h-3.5 w-3.5" />
                    Subtasks
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {task.subtasks.length}
                    </Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger value="dependencies" className="gap-1.5 text-xs">
                  <Link2 className="h-3.5 w-3.5" />
                  Deps
                </TabsTrigger>
                <TabsTrigger value="time" className="gap-1.5 text-xs">
                  <Timer className="h-3.5 w-3.5" />
                  Time
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="p-4 flex-1">
                <div className="space-y-4">
                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">
                      Description
                    </label>
                    {editingDesc ? (
                      <div className="space-y-2">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[100px] text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleDescSave}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDesc(false);
                              setDescription(task.description ?? "");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-md p-2 min-h-[60px] whitespace-pre-wrap"
                        onClick={() => setEditingDesc(true)}
                      >
                        {task.description || "Click to add a description..."}
                      </div>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                    <div className="flex justify-between">
                      <span>Created by</span>
                      <span>{task.createdBy.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>
                        {new Date(task.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {task.completedAt && (
                      <div className="flex justify-between">
                        <span>Completed</span>
                        <span>
                          {new Date(task.completedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="p-4 flex-1">
                <CommentFeed
                  taskId={task.id}
                  comments={task.comments ?? []}
                  currentUserId={currentUserId}
                  onUpdated={loadTask}
                />
              </TabsContent>

              <TabsContent value="checklists" className="p-4 flex-1">
                <Checklist
                  taskId={task.id}
                  checklists={task.checklists ?? []}
                  onUpdated={loadTask}
                />
              </TabsContent>

              {task.subtasks && task.subtasks.length > 0 && (
                <TabsContent value="subtasks" className="p-4 flex-1">
                  <div className="space-y-1">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50"
                      >
                        <StatusBadge
                          name={sub.status.name}
                          color={sub.status.color}
                        />
                        <span className="text-sm flex-1 truncate">
                          {sub.title}
                        </span>
                        {sub.assignee && (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">
                              {getInitials(sub.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="dependencies" className="p-4 flex-1">
                <TaskDependencies
                  taskId={task.id}
                  projectId={projectId ?? task.projectId}
                  onUpdated={() => { loadTask(); onUpdated?.(); }}
                />
              </TabsContent>

              <TabsContent value="time" className="p-4 flex-1">
                <TimeTracker
                  taskId={task.id}
                  estimateMinutes={task.estimateMinutes}
                  loggedMinutes={task.loggedMinutes}
                  currentUserId={currentUserId}
                  onUpdated={() => { loadTask(); onUpdated?.(); }}
                />
              </TabsContent>
            </Tabs>

            {/* Footer actions */}
            <div className="border-t p-4 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete task
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
