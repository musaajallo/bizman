"use client";

import { useState, useTransition } from "react";
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Tag,
  FolderTree,
  TrendingUp,
  AlertCircle,
  PowerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteExpenseCategory,
  toggleCategoryActive,
  type CategoryNode,
  type CategorySpend,
} from "@/lib/actions/expense-categories";
import { CategoryFormDialog } from "./category-form-dialog";

interface Props {
  tenantId: string;
  tree: CategoryNode[];
  spendReport: CategorySpend[];
  ledgerAccounts: { id: string; code: string; name: string }[];
}

// Flatten tree for parent picker
function flattenTree(
  nodes: CategoryNode[]
): { id: string; name: string; parentId: string | null }[] {
  const result: { id: string; name: string; parentId: string | null }[] = [];
  function walk(n: CategoryNode) {
    result.push({ id: n.id, name: n.name, parentId: n.parentId });
    n.children.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GM", {
    style: "currency",
    currency: "GMD",
    maximumFractionDigits: 0,
  }).format(n);
}

function CategoryRow({
  node,
  depth,
  tenantId,
  allFlat,
  ledgerAccounts,
  spendMap,
  onEdit,
  onDelete,
  onToggle,
}: {
  node: CategoryNode;
  depth: number;
  tenantId: string;
  allFlat: { id: string; name: string; parentId: string | null }[];
  ledgerAccounts: { id: string; code: string; name: string }[];
  spendMap: Map<string, CategorySpend>;
  onEdit: (node: CategoryNode) => void;
  onDelete: (node: CategoryNode) => void;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const spend = spendMap.get(node.id);
  const usageCount =
    node._count.expenses + node._count.billItems + node._count.poItems;

  return (
    <>
      <tr
        className={cn(
          "border-b transition-colors hover:bg-muted/30",
          !node.isActive && "opacity-50"
        )}
      >
        <td className="py-2.5 px-4">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expanded && "rotate-90"
                  )}
                />
              </button>
            ) : (
              <span className="w-4" />
            )}
            {node.color ? (
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: node.color }}
              />
            ) : (
              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-sm">{node.name}</span>
            {node.isSystem && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                system
              </Badge>
            )}
            {!node.isActive && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                inactive
              </Badge>
            )}
          </div>
        </td>
        <td className="py-2.5 px-3">
          {node.code && (
            <span className="font-mono text-xs text-muted-foreground">
              {node.code}
            </span>
          )}
        </td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">
          {node.ledgerAccount ? (
            <span className="font-mono text-xs">
              {node.ledgerAccount.code} · {node.ledgerAccount.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </td>
        <td className="py-2.5 px-3 text-right text-sm">
          {usageCount > 0 ? (
            <span className="text-muted-foreground">{usageCount} records</span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
        <td className="py-2.5 px-3 text-right text-sm font-medium">
          {spend ? fmt(spend.total) : <span className="text-muted-foreground/40">—</span>}
        </td>
        <td className="py-2.5 px-3 text-right">
          {!node.isSystem && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggle(node.id)}>
                  <PowerOff className="mr-2 h-4 w-4" />
                  {node.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(node)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      </tr>
      {expanded &&
        node.children.map((child) => (
          <CategoryRow
            key={child.id}
            node={child}
            depth={depth + 1}
            tenantId={tenantId}
            allFlat={allFlat}
            ledgerAccounts={ledgerAccounts}
            spendMap={spendMap}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export function CategoriesClient({
  tenantId,
  tree,
  spendReport,
  ledgerAccounts,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState<CategoryNode | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allFlat = flattenTree(tree);
  const spendMap = new Map(spendReport.map((s) => [s.categoryId, s]));

  const totalSpend = spendReport.reduce((s, r) => s + r.total, 0);

  const handleEdit = (node: CategoryNode) => {
    setEditing(node);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = (node: CategoryNode) => {
    setDeleting(node);
    setDeleteError(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      try {
        await deleteExpenseCategory(tenantId, deleting.id);
        setDeleting(null);
      } catch (e: unknown) {
        setDeleteError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(() => toggleCategoryActive(tenantId, id));
  };

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{allFlat.length}</span>
              <FolderTree className="h-5 w-5 text-muted-foreground mb-0.5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categories with Spend (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{spendReport.length}</span>
              <TrendingUp className="h-5 w-5 text-muted-foreground mb-0.5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Spend YTD
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold font-mono">{fmt(totalSpend)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category tree table */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Category Hierarchy</h2>
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Category
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 px-4 text-left font-medium">Category</th>
                <th className="py-2 px-3 text-left font-medium">Code</th>
                <th className="py-2 px-3 text-left font-medium">GL Account</th>
                <th className="py-2 px-3 text-right font-medium">Usage</th>
                <th className="py-2 px-3 text-right font-medium">Spend YTD</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {tree.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No categories yet.{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={handleNew}
                    >
                      Add the first one.
                    </button>
                  </td>
                </tr>
              ) : (
                tree.map((node) => (
                  <CategoryRow
                    key={node.id}
                    node={node}
                    depth={0}
                    tenantId={tenantId}
                    allFlat={allFlat}
                    ledgerAccounts={ledgerAccounts}
                    spendMap={spendMap}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spend breakdown (top 10) */}
      {spendReport.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Spend by Category (YTD)</h2>
          </div>
          <div className="p-4 space-y-2">
            {spendReport.slice(0, 10).map((row) => {
              const pct = totalSpend > 0 ? (row.total / totalSpend) * 100 : 0;
              return (
                <div key={row.categoryId} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 text-sm truncate">
                    {row.categoryName}
                  </div>
                  <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-28 text-right font-mono text-sm">
                    {fmt(row.total)}
                  </div>
                  <div className="w-10 text-right text-xs text-muted-foreground">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form dialog */}
      <CategoryFormDialog
        tenantId={tenantId}
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        allCategories={allFlat}
        ledgerAccounts={ledgerAccounts}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v: boolean) => !v && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be permanently removed. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
