"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Pencil, Download, FileText, Send } from "lucide-react";
import { addBudgetLine, deleteBudgetLine, updateBudgetLine, updateBudgetStatus } from "@/lib/actions/budgets";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  submitted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface BudgetLine {
  id: string; label: string; lineType: string; reference: string | null;
  allocatedAmount: number; actual: number; notes: string | null;
}

interface Budget {
  id: string; name: string; description: string | null;
  startDate: string; endDate: string; currency: string; status: string;
  lines: BudgetLine[];
  totalAllocated: number;
  actuals: { totalExpenses: number; totalBills: number; totalPayroll: number; grand: number };
}

function downloadCsv(budget: Budget) {
  const rows: string[][] = [
    ["Label", "Type", "Allocated", "Actual", "Variance", "% Used"],
  ];
  for (const l of budget.lines) {
    const v = l.allocatedAmount - l.actual;
    const pct = l.allocatedAmount > 0 ? Math.round((l.actual / l.allocatedAmount) * 100) : 0;
    rows.push([l.label, l.lineType, l.allocatedAmount.toFixed(2), l.actual.toFixed(2), v.toFixed(2), `${pct}%`]);
  }
  const totalActual = budget.lines.reduce((s, l) => s + l.actual, 0);
  const totalVariance = budget.totalAllocated - totalActual;
  rows.push(["TOTAL", "", budget.totalAllocated.toFixed(2), totalActual.toFixed(2), totalVariance.toFixed(2), ""]);
  rows.push([]);
  rows.push(["Actuals Breakdown"]);
  rows.push(["Expenses", budget.actuals.totalExpenses.toFixed(2)]);
  rows.push(["Bills", budget.actuals.totalBills.toFixed(2)]);
  rows.push(["Payroll", budget.actuals.totalPayroll.toFixed(2)]);

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `budget-${budget.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BudgetDetailClient({ budget }: { budget: Budget }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editLine, setEditLine] = useState<BudgetLine | null>(null);
  const [deleteLineId, setDeleteLineId] = useState<string | null>(null);
  const [lineType, setLineType] = useState("category");

  function handleAddLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lineType", lineType);
    startTransition(async () => {
      await addBudgetLine(budget.id, fd);
      setAddOpen(false);
      router.refresh();
    });
  }

  function handleEditLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editLine) return;
    const fd = new FormData(e.currentTarget);
    const amount = parseFloat(fd.get("allocatedAmount") as string);
    startTransition(async () => {
      await updateBudgetLine(editLine.id, budget.id, amount);
      setEditLine(null);
      router.refresh();
    });
  }

  function handleDeleteLine() {
    if (!deleteLineId) return;
    startTransition(async () => {
      await deleteBudgetLine(deleteLineId, budget.id);
      setDeleteLineId(null);
      router.refresh();
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      await updateBudgetStatus(budget.id, "submitted");
      router.refresh();
    });
  }

  const totalActual = budget.lines.reduce((s, l) => s + l.actual, 0);
  const variance = budget.totalAllocated - totalActual;
  const canEdit = budget.status !== "approved";

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{budget.name}</CardTitle>
              {budget.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{budget.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(budget.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                {" – "}
                {new Date(budget.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={STATUS_STYLES[budget.status] ?? ""}>
                {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
              </Badge>
              {budget.status === "draft" && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSubmit} disabled={isPending}>
                  <Send className="h-3.5 w-3.5" />Submit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Allocated", value: `${budget.currency} ${budget.totalAllocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: "Actual Spend", value: `${budget.currency} ${totalActual.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: "Variance", value: `${variance >= 0 ? "+" : ""}${budget.currency} ${variance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, highlight: variance < 0 },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/40 rounded-lg py-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-base font-semibold mt-0.5 ${s.highlight ? "text-red-400" : s.label === "Variance" ? "text-emerald-400" : ""}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Budget Lines</CardTitle>
            {canEdit && (
              <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />Add Line
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {budget.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No budget lines yet. Add your first line to start planning.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.lines.map((l) => {
                  const v = l.allocatedAmount - l.actual;
                  const pct = l.allocatedAmount > 0 ? Math.round((l.actual / l.allocatedAmount) * 100) : 0;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.label}</TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">{l.lineType.replace("_", " ")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {budget.currency} {l.allocatedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-sm">
                            {budget.currency} {l.actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-sm flex items-center justify-end gap-1 ${v < 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {v < 0 ? <TrendingUp className="h-3 w-3" /> : v > 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditLine(l)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              disabled={isPending}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteLineId(l.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              disabled={isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actuals summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actuals Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Auto-pulled from expenses, bills and payroll for this period.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { label: "Expenses", value: budget.actuals.totalExpenses },
              { label: "Bills", value: budget.actuals.totalBills },
              { label: "Payroll", value: budget.actuals.totalPayroll },
            ].map((s) => (
              <div key={s.label} className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-mono">{budget.currency} {s.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv(budget)}>
          <Download className="h-4 w-4" />Export CSV
        </Button>
        <a href={`/api/budgets/${budget.id}/pdf`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />Export PDF
          </Button>
        </a>
      </div>

      {/* Add line dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Budget Line</DialogTitle></DialogHeader>
          <form onSubmit={handleAddLine} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label">Label <span className="text-destructive">*</span></Label>
              <Input id="label" name="label" placeholder="e.g. Marketing, Travel, Salaries" required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={lineType} onValueChange={(v: string | null) => { if (v) setLineType(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Expense Category</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input id="reference" name="reference" placeholder="Exact category/department name to match actuals" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allocatedAmount">Allocated Amount <span className="text-destructive">*</span></Label>
              <Input id="allocatedAmount" name="allocatedAmount" type="number" step="0.01" min="0" required placeholder="0.00" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit line dialog */}
      <Dialog open={!!editLine} onOpenChange={(open) => { if (!open) setEditLine(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Edit Budget Line</DialogTitle></DialogHeader>
          {editLine && (
            <form onSubmit={handleEditLine} className="space-y-4">
              <p className="text-sm font-medium">{editLine.label}</p>
              <div className="space-y-1.5">
                <Label htmlFor="editAllocatedAmount">Allocated Amount <span className="text-destructive">*</span></Label>
                <Input
                  id="editAllocatedAmount"
                  name="allocatedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editLine.allocatedAmount}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditLine(null)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete line confirmation */}
      <Dialog open={!!deleteLineId} onOpenChange={(open) => { if (!open) setDeleteLineId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remove Budget Line</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remove this line from the budget?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteLineId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteLine} disabled={isPending}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
