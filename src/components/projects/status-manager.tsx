"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProjectStatus,
  updateProjectStatusItem,
  deleteProjectStatus,
  reorderProjectStatuses,
} from "@/lib/actions/projects";
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  Pencil,
  X,
  ArrowUp,
  ArrowDown,
  Star,
} from "lucide-react";

interface Status {
  id: string;
  name: string;
  color: string;
  group: string;
  order: number;
  isDefault: boolean;
  _count: { tasks: number };
}

const GROUP_OPTIONS = [
  { value: "not_started", label: "Not Started", description: "Tasks not yet begun" },
  { value: "active", label: "Active", description: "Tasks in progress" },
  { value: "done", label: "Done", description: "Completed tasks" },
  { value: "closed", label: "Closed", description: "Archived/cancelled" },
];

const PRESET_COLORS = [
  "#6B7280", "#3B82F6", "#F59E0B", "#22C55E", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#14B8A6",
];

interface StatusManagerProps {
  projectId: string;
  statuses: Status[];
  onUpdated: () => void;
}

function StatusRow({
  status,
  statuses,
  projectId,
  onUpdated,
}: {
  status: Status;
  statuses: Status[];
  projectId: string;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [group, setGroup] = useState(status.group);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const result = await updateProjectStatusItem(status.id, { name, color, group });
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
      onUpdated();
    }
    setSaving(false);
  }

  async function handleDelete() {
    setError("");
    const result = await deleteProjectStatus(status.id);
    if (result.error) {
      setError(result.error);
    } else {
      onUpdated();
    }
  }

  async function handleSetDefault() {
    await updateProjectStatusItem(status.id, { isDefault: true });
    onUpdated();
  }

  async function handleMoveUp() {
    const idx = statuses.findIndex((s) => s.id === status.id);
    if (idx <= 0) return;
    const ids = statuses.map((s) => s.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    await reorderProjectStatuses(projectId, ids);
    onUpdated();
  }

  async function handleMoveDown() {
    const idx = statuses.findIndex((s) => s.id === status.id);
    if (idx >= statuses.length - 1) return;
    const ids = statuses.map((s) => s.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    await reorderProjectStatuses(projectId, ids);
    onUpdated();
  }

  const groupLabel = GROUP_OPTIONS.find((g) => g.value === status.group)?.label ?? status.group;

  if (editing) {
    return (
      <div className="border rounded-lg p-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Group</Label>
            <Select value={group} onValueChange={(v) => v && setGroup(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 rounded border cursor-pointer"
              />
              <div className="flex gap-1 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-5 w-5 rounded-full border border-transparent hover:border-foreground/30 transition-colors"
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setName(status.name);
              setColor(status.color);
              setGroup(status.group);
              setError("");
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2 px-1 group">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />

      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: status.color }}
      />

      <span className="text-sm font-medium flex-1">{status.name}</span>

      <Badge variant="outline" className="text-[10px]">
        {groupLabel}
      </Badge>

      {status.isDefault && (
        <Badge variant="secondary" className="text-[10px] gap-0.5">
          <Star className="h-2.5 w-2.5" />
          Default
        </Badge>
      )}

      <span className="text-xs text-muted-foreground w-12 text-right">
        {status._count.tasks} tasks
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
          onClick={handleMoveUp}
          title="Move up"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
          onClick={handleMoveDown}
          title="Move down"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
        {!status.isDefault && (
          <button
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
            onClick={handleSetDefault}
            title="Set as default"
          >
            <Star className="h-3 w-3" />
          </button>
        )}
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
          onClick={() => setEditing(true)}
          title="Edit"
        >
          <Pencil className="h-3 w-3" />
        </button>
        {!status.isDefault && (
          <button
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function StatusManager({ projectId, statuses, onUpdated }: StatusManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");
  const [newGroup, setNewGroup] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const result = await createProjectStatus(projectId, {
      name: newName.trim(),
      color: newColor,
      group: newGroup,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setNewName("");
      setNewColor("#6B7280");
      setNewGroup("active");
      setAdding(false);
      onUpdated();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      {statuses.map((status) => (
        <StatusRow
          key={status.id}
          status={status}
          statuses={statuses}
          projectId={projectId}
          onUpdated={onUpdated}
        />
      ))}

      {adding ? (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. QA Testing"
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Group</Label>
              <Select value={newGroup} onValueChange={(v) => v && setNewGroup(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      <div>
                        <span>{g.label}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">
                          — {g.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-8 rounded border cursor-pointer"
                />
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-5 w-5 rounded-full border border-transparent hover:border-foreground/30 transition-colors"
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? "Creating..." : "Create Status"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Status
        </Button>
      )}
    </div>
  );
}
