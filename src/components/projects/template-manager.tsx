"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Copy, Trash2, FileText, Plus, ListChecks } from "lucide-react";
import {
  getTemplates,
  getTemplate,
  createProjectFromTemplate,
  deleteTemplate,
} from "@/lib/actions/project-templates";
import { getOwnerBusiness } from "@/lib/actions/tenants";

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  createdAt: Date | string;
  createdBy: { id: string; name: string | null };
  _count: { tasks: number };
}

interface TemplateDetail {
  id: string;
  name: string;
  description: string | null;
  statuses: unknown;
  tasks: { id: string; title: string; priority: string; parentId: string | null; order: number }[];
}

interface Props {
  tenantId: string;
  onProjectCreated?: (slug: string) => void;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function TemplateManager({ tenantId, onProjectCreated }: Props) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selected, setSelected] = useState<TemplateDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await getTemplates(tenantId);
    setTemplates(data as unknown as TemplateItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenantId]);

  const handleView = async (id: string) => {
    const detail = await getTemplate(id);
    if (detail) {
      setSelected(detail as unknown as TemplateDetail);
      setSheetOpen(true);
    }
  };

  const handleCreateProject = async () => {
    if (!selected || !projectName.trim()) return;
    setCreating(true);
    const result = await createProjectFromTemplate(selected.id, {
      tenantId,
      name: projectName.trim(),
      slug: slugify(projectName.trim()) + "-" + Date.now().toString(36),
    });
    if (result.success && result.projectSlug) {
      setSheetOpen(false);
      setProjectName("");
      onProjectCreated?.(result.projectSlug);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteTemplate(id);
    await load();
  };

  if (loading) {
    return <div className="animate-pulse space-y-2">
      {[1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded" />)}
    </div>;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No templates yet.</p>
        <p className="text-xs mt-1">Save a project as a template from its settings page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {templates.map((tpl) => (
          <Card key={tpl.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => handleView(tpl.id)}>
            <CardContent className="py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Copy className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{tpl.name}</p>
                {tpl.description && (
                  <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                <ListChecks className="h-3 w-3 mr-1" />
                {tpl._count.tasks} tasks
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              {selected.description && (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              )}

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tasks ({selected.tasks.filter((t) => !t.parentId).length})
                </p>
                {selected.tasks
                  .filter((t) => !t.parentId)
                  .map((task) => (
                    <div key={task.id} className="text-sm py-1 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      {task.title}
                      {selected.tasks.filter((s) => s.parentId === task.id).length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (+{selected.tasks.filter((s) => s.parentId === task.id).length} subtasks)
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Create project from template</p>
                <Input
                  placeholder="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-9"
                />
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || creating}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
