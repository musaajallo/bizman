"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";
import { useState } from "react";

export function QuickAddTask({
  projectId,
  milestoneId,
  onAdded,
}: {
  projectId: string;
  milestoneId?: string;
  onAdded?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("title", title.trim());
    if (milestoneId) formData.set("milestoneId", milestoneId);

    const result = await createTask(formData);
    setLoading(false);

    if (result.success) {
      setTitle("");
      onAdded?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="h-8 text-sm"
        disabled={loading}
      />
      {title.trim() && (
        <Button type="submit" size="sm" variant="ghost" disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </Button>
      )}
    </form>
  );
}
