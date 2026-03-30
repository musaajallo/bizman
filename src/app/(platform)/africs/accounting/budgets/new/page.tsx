"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBudget } from "@/lib/actions/budgets";

export default function NewBudgetPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBudget(fd);
      if ("id" in result) router.push(`/africs/accounting/budgets/${result.id}`);
    });
  }

  return (
    <div>
      <TopBar
        title="New Budget"
        subtitle="Create a budget period with planned spend lines"
        actions={
          <Link href="/africs/accounting/budgets">
            <Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="name">Budget Name <span className="text-destructive">*</span></Label>
            <Input id="name" name="name" placeholder="e.g. FY2026 Operations Budget" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Optional description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 7) + "-01"} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Date <span className="text-destructive">*</span></Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10)} required />
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue="GMD" className="uppercase" />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Budget"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
