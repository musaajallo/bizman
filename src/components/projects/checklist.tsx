"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/lib/actions/task-checklists";
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
  CheckSquare,
} from "lucide-react";

interface ChecklistItemData {
  id: string;
  title: string;
  isComplete: boolean;
  assignee: { id: string; name: string | null; image: string | null } | null;
}

interface ChecklistData {
  id: string;
  title: string;
  items: ChecklistItemData[];
}

interface ChecklistProps {
  taskId: string;
  checklists: ChecklistData[];
  onUpdated: () => void;
}

function ChecklistSection({
  checklist,
  onUpdated,
}: {
  checklist: ChecklistData;
  onUpdated: () => void;
}) {
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const completed = checklist.items.filter((i) => i.isComplete).length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleAddItem() {
    if (!newItem.trim()) return;
    setSubmitting(true);
    await addChecklistItem(checklist.id, newItem);
    setNewItem("");
    setSubmitting(false);
    onUpdated();
  }

  async function handleToggle(itemId: string) {
    await toggleChecklistItem(itemId);
    onUpdated();
  }

  async function handleDeleteItem(itemId: string) {
    await deleteChecklistItem(itemId);
    onUpdated();
  }

  async function handleDeleteChecklist() {
    await deleteChecklist(checklist.id);
    onUpdated();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{checklist.title}</span>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">
              {completed}/{total}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDeleteChecklist}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete checklist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group py-0.5">
            <Checkbox
              checked={item.isComplete}
              onCheckedChange={() => handleToggle(item.id)}
              className="shrink-0"
            />
            <span
              className={`text-sm flex-1 ${
                item.isComplete
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {item.title}
            </span>
            <button
              className="h-5 w-5 inline-flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent text-muted-foreground hover:text-destructive"
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItem();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item..."
            className="h-7 text-sm"
            autoFocus
            disabled={submitting}
          />
          <Button type="submit" size="sm" variant="ghost" disabled={submitting || !newItem.trim()}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setNewItem("");
            }}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add item
        </Button>
      )}
    </div>
  );
}

export function Checklist({ taskId, checklists, onUpdated }: ChecklistProps) {
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    await createChecklist(taskId);
    setCreating(false);
    onUpdated();
  }

  return (
    <div className="space-y-4">
      {checklists.map((cl) => (
        <ChecklistSection key={cl.id} checklist={cl} onUpdated={onUpdated} />
      ))}

      <Button
        size="sm"
        variant="outline"
        onClick={handleCreate}
        disabled={creating}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add checklist
      </Button>
    </div>
  );
}
