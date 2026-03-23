"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  updateMilestone,
} from "@/lib/actions/milestones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  Flag,
  Calendar,
} from "lucide-react";

interface MilestoneData {
  id: string;
  name: string;
  description: string | null;
  dueDate: Date | string | null;
  completed: boolean;
  completedAt: Date | string | null;
}

interface MilestoneListProps {
  projectId: string;
  milestones: MilestoneData[];
  onUpdated: () => void;
}

function MilestoneRow({
  milestone,
  onUpdated,
}: {
  milestone: MilestoneData;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(milestone.name);
  const [dueDate, setDueDate] = useState(
    milestone.dueDate
      ? new Date(milestone.dueDate).toISOString().split("T")[0]
      : ""
  );

  const isOverdue =
    milestone.dueDate &&
    !milestone.completed &&
    new Date(milestone.dueDate) < new Date();

  async function handleToggle() {
    await toggleMilestone(milestone.id);
    onUpdated();
  }

  async function handleSave() {
    await updateMilestone(milestone.id, { name, dueDate: dueDate || undefined });
    setEditing(false);
    onUpdated();
  }

  async function handleDelete() {
    await deleteMilestone(milestone.id);
    onUpdated();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 text-sm w-36"
        />
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 py-2 group">
      <Checkbox
        checked={milestone.completed}
        onCheckedChange={handleToggle}
        className="shrink-0"
      />

      <Flag className={`h-3.5 w-3.5 shrink-0 ${milestone.completed ? "text-emerald-500" : "text-muted-foreground"}`} />

      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            milestone.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {milestone.name}
        </span>
        {milestone.description && (
          <p className="text-xs text-muted-foreground truncate">
            {milestone.description}
          </p>
        )}
      </div>

      {milestone.dueDate && (
        <span
          className={`text-xs font-mono shrink-0 flex items-center gap-1 ${
            isOverdue ? "text-red-500" : "text-muted-foreground"
          }`}
        >
          <Calendar className="h-3 w-3" />
          {new Date(milestone.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}

      {milestone.completed && milestone.completedAt && (
        <span className="text-[10px] text-emerald-500">
          Done {new Date(milestone.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
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
  );
}

export function MilestoneList({
  projectId,
  milestones,
  onUpdated,
}: MilestoneListProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    await createMilestone(projectId, {
      name: newName.trim(),
      dueDate: newDueDate || undefined,
    });
    setNewName("");
    setNewDueDate("");
    setAdding(false);
    setSubmitting(false);
    onUpdated();
  }

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>{completed}/{total} completed</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span>{pct}%</span>
        </div>
      )}

      <div className="divide-y">
        {milestones.map((m) => (
          <MilestoneRow key={m.id} milestone={m} onUpdated={onUpdated} />
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Milestone name..."
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="h-8 text-sm w-36"
          />
          <Button size="sm" onClick={handleAdd} disabled={submitting || !newName.trim()}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-1"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Milestone
        </Button>
      )}
    </div>
  );
}
