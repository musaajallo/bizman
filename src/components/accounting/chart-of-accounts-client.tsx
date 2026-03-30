"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, PowerOff, Zap } from "lucide-react";
import {
  initializeAccounting,
  createLedgerAccount,
  updateLedgerAccount,
  toggleLedgerAccountActive,
} from "@/lib/actions/accounting/accounts";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  "Asset", "Liability", "Equity", "Revenue", "CostOfSales", "Expense", "NonOperating",
] as const;

const TYPE_STYLES: Record<string, string> = {
  Asset:          "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Liability:      "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Equity:         "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Revenue:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CostOfSales:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Expense:        "bg-orange-500/10 text-orange-400 border-orange-500/20",
  NonOperating:   "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface Account {
  id: string; code: string; name: string; type: string;
  normalBalance: string; isContra: boolean; isSystem: boolean;
  isActive: boolean; parentId: string | null;
  _count: { journalEntryLines: number };
}

export function ChartOfAccountsClient({
  accounts,
  initialized,
}: {
  accounts: Account[];
  initialized: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [normalBalance, setNormalBalance] = useState<"debit" | "credit">("debit");
  const [accountType, setAccountType] = useState<string>("Asset");

  function handleInit() {
    startTransition(async () => {
      await initializeAccounting();
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLedgerAccount(fd);
      if ("error" in result) { alert(result.error); return; }
      setAddOpen(false);
      router.refresh();
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editAccount) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateLedgerAccount(editAccount.id, fd);
      setEditAccount(null);
      router.refresh();
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleLedgerAccountActive(id);
      if (result && "error" in result) { alert(result.error); return; }
      router.refresh();
    });
  }

  // Auto-set normal balance when type changes
  function onTypeChange(t: string) {
    setAccountType(t);
    const creditTypes = ["Liability", "Equity", "Revenue", "NonOperating"];
    setNormalBalance(creditTypes.includes(t) ? "credit" : "debit");
  }

  const filtered = accounts.filter((a) => {
    const matchSearch = search === "" ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  // Group by type
  const grouped = ACCOUNT_TYPES.map((type) => ({
    type,
    accounts: filtered.filter((a) => a.type === type),
  })).filter((g) => g.accounts.length > 0);

  if (!initialized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Set up your Chart of Accounts</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Initialise with a pre-seeded default chart (40+ accounts) covering assets,
            liabilities, equity, revenue, and expenses. You can customise it after.
          </p>
        </div>
        <Button onClick={handleInit} disabled={isPending}>
          {isPending ? "Setting up..." : "Initialise Chart of Accounts"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={(v: string | null) => { if (v) setTypeFilter(v); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />Add Account
          </Button>
        </div>
      </div>

      {/* Accounts grouped by type */}
      {grouped.map((group) => (
        <div key={group.type} className="rounded-md border overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", TYPE_STYLES[group.type])}>
              {group.type === "CostOfSales" ? "Cost of Sales" : group.type === "NonOperating" ? "Non-Operating" : group.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{group.accounts.length} accounts</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Normal Balance</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.accounts.map((a) => (
                <TableRow key={a.id} className={cn(!a.isActive && "opacity-50")}>
                  <TableCell className="font-mono text-sm font-medium">{a.code}</TableCell>
                  <TableCell>
                    <span className="font-medium">{a.name}</span>
                    {a.isContra && (
                      <span className="ml-2 text-xs text-muted-foreground">(contra)</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">
                    {a.normalBalance}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {a._count.journalEntryLines}
                  </TableCell>
                  <TableCell>
                    {a.isActive ? (
                      <span className="text-xs text-emerald-400">Active</span>
                    ) : (
                      <span className="text-xs text-zinc-500">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => setEditAccount(a)}>
                          <Pencil className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleToggle(a.id)}
                          disabled={a.isSystem && a.isActive}
                        >
                          <PowerOff className="h-4 w-4 mr-2" />
                          {a.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No accounts match your search.</p>
      )}

      {/* Add account dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Account</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
                <Input id="code" name="code" placeholder="e.g. 6950" required />
              </div>
              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={accountType} onValueChange={(v: string | null) => { if (v) onTypeChange(v); }} name="type">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input type="hidden" name="type" value={accountType} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" placeholder="e.g. Office Supplies" required />
            </div>
            <div className="space-y-1.5">
              <Label>Normal Balance</Label>
              <Select value={normalBalance} onValueChange={(v: string | null) => { if (v === "debit" || v === "credit") setNormalBalance(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="normalBalance" value={normalBalance} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isContra" name="isContra" value="true" />
              <Label htmlFor="isContra" className="font-normal text-sm">Contra account</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>Add Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit account dialog */}
      <Dialog open={!!editAccount} onOpenChange={(open) => { if (!open) setEditAccount(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Account</DialogTitle></DialogHeader>
          {editAccount && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                <span className="font-mono text-sm font-medium">{editAccount.code}</span>
                <Badge variant="outline" className={cn("text-xs", TYPE_STYLES[editAccount.type])}>
                  {editAccount.type}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editName">Name <span className="text-destructive">*</span></Label>
                <Input id="editName" name="name" defaultValue={editAccount.name} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editDescription">Description</Label>
                <Input id="editDescription" name="description" placeholder="Optional description" />
              </div>
              <p className="text-xs text-muted-foreground">Account type and normal balance cannot be changed after creation.</p>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditAccount(null)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
