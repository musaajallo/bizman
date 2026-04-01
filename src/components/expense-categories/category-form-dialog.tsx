"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createExpenseCategory, updateExpenseCategory } from "@/lib/actions/expense-categories";
import type { CategoryNode } from "@/lib/actions/expense-categories";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().max(20).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
  ledgerAccountId: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex colour")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tenantId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: CategoryNode | null;
  /** Flat list for parent picker */
  allCategories: { id: string; name: string; parentId: string | null }[];
  ledgerAccounts: { id: string; code: string; name: string }[];
  defaultParentId?: string | null;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#06b6d4",
];

export function CategoryFormDialog({
  tenantId,
  open,
  onOpenChange,
  editing,
  allCategories,
  ledgerAccounts,
  defaultParentId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: editing?.name ?? "",
      code: editing?.code ?? "",
      description: editing?.description ?? "",
      parentId: editing?.parentId ?? defaultParentId ?? null,
      ledgerAccountId: editing?.ledgerAccountId ?? null,
      color: editing?.color ?? null,
      isActive: editing?.isActive ?? true,
      sortOrder: editing?.sortOrder ?? 0,
    },
  });

  // Reset when dialog re-opens with different editing target
  const handleOpenChange = (v: boolean) => {
    if (v) {
      form.reset({
        name: editing?.name ?? "",
        code: editing?.code ?? "",
        description: editing?.description ?? "",
        parentId: editing?.parentId ?? defaultParentId ?? null,
        ledgerAccountId: editing?.ledgerAccountId ?? null,
        color: editing?.color ?? null,
        isActive: editing?.isActive ?? true,
        sortOrder: editing?.sortOrder ?? 0,
      });
      setError(null);
    }
    onOpenChange(v);
  };

  const onSubmit = (values: FormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        if (editing) {
          await updateExpenseCategory(tenantId, editing.id, values);
        } else {
          await createExpenseCategory(tenantId, values);
        }
        onOpenChange(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An error occurred");
      }
    });
  };

  // Only show non-system parents and don't allow a category to be its own parent
  const parentOptions = allCategories.filter(
    (c) => c.id !== editing?.id
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Category" : "New Expense Category"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Office Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="OFFICE"
                        {...field}
                        value={field.value ?? ""}
                        className="font-mono uppercase"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase() || null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None (top-level)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {parentOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.parentId ? `  ↳ ${c.name}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {ledgerAccounts.length > 0 && (
              <FormField
                control={form.control}
                name="ledgerAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked GL Account</FormLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? null : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {ledgerAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-mono text-xs mr-2 text-muted-foreground">
                              {a.code}
                            </span>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colour</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="h-6 w-6 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: c,
                          borderColor:
                            field.value === c ? "white" : "transparent",
                          outline:
                            field.value === c ? `2px solid ${c}` : "none",
                        }}
                        onClick={() =>
                          field.onChange(field.value === c ? null : c)
                        }
                      />
                    ))}
                    <Input
                      type="color"
                      className="h-6 w-6 cursor-pointer rounded-full border p-0"
                      value={field.value ?? "#6366f1"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
