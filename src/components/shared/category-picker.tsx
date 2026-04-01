"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type FlatCategory = {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
};

interface CategoryPickerProps {
  categories: FlatCategory[];
  value?: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type TreeNode = FlatCategory & { children: TreeNode[] };

function buildTree(cats: FlatCategory[], parentId: string | null = null): TreeNode[] {
  return cats
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(cats, c.id) }));
}

function TreeRow({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null | undefined;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors",
          "hover:bg-accent/60",
          selected === node.id && "bg-accent text-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="flex-1 text-left truncate">{node.name}</span>
        {node.code && (
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {node.code}
          </span>
        )}
      </button>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = "Select category",
  disabled,
  className,
}: CategoryPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = categories.find((c) => c.id === value);

  const filtered = React.useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code?.toLowerCase().includes(q) ?? false)
    );
  }, [categories, search]);

  const tree = React.useMemo(
    () => (search ? [] : buildTree(categories)),
    [categories, search]
  );

  const handleSelect = (id: string) => {
    onChange(id === value ? null : id);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="truncate">
          {selected ? selected.name : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <ScrollArea className="h-64">
          {search ? (
            filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No categories found
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent/60",
                    value === c.id && "bg-accent text-accent-foreground font-medium"
                  )}
                  onClick={() => handleSelect(c.id)}
                >
                  <span className="flex-1 text-left">{c.name}</span>
                  {c.code && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {c.code}
                    </span>
                  )}
                </button>
              ))
            )
          ) : (
            tree.map((node) => (
              <TreeRow
                key={node.id}
                node={node}
                depth={0}
                selected={value}
                onSelect={handleSelect}
              />
            ))
          )}
        </ScrollArea>
        {value && (
          <div className="mt-2 border-t pt-2">
            <button
              type="button"
              className="w-full rounded px-2 py-1 text-left text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
