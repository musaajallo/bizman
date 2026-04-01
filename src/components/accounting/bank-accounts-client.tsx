"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createBankAccount, updateBankAccount, toggleBankAccountActive } from "@/lib/actions/accounting/bank-reconciliation";

interface LedgerAccount { id: string; code: string; name: string; }
interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string | null;
  currency: string;
  ledgerAccountId: string | null;
  ledgerAccount: { code: string; name: string } | null;
  isActive: boolean;
  lastStatement: { status: string; updatedAt: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft:        "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  in_progress:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reconciled:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", in_progress: "In Progress", reconciled: "Reconciled", confirmed: "Confirmed",
};

function AccountDialog({
  open, onClose, ledgerAccounts, initial,
}: {
  open: boolean;
  onClose: () => void;
  ledgerAccounts: LedgerAccount[];
  initial?: BankAccount;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (initial) {
        await updateBankAccount(initial.id, fd);
      } else {
        await createBankAccount(fd);
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Account Name <span className="text-destructive">*</span></Label>
            <Input name="name" placeholder="e.g. GTBank Operating Account" defaultValue={initial?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Account Number <span className="text-destructive">*</span></Label>
              <Input name="accountNumber" placeholder="e.g. 1234567890" defaultValue={initial?.accountNumber} required disabled={!!initial} />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input name="bankName" placeholder="e.g. GTBank" defaultValue={initial?.bankName ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input name="currency" placeholder="GMD" defaultValue={initial?.currency ?? "GMD"} />
            </div>
            <div className="space-y-2">
              <Label>GL Account (Cash)</Label>
              <Select name="ledgerAccountId" defaultValue={initial?.ledgerAccountId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {ledgerAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="font-mono text-xs mr-1">{a.code}</span>{a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BankAccountsClient({
  accounts,
  ledgerAccounts,
}: {
  accounts: BankAccount[];
  ledgerAccounts: LedgerAccount[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleBankAccountActive(id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4 w-full">
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />Add Bank Account
        </Button>
      </div>

      {accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-2">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No bank accounts set up yet.</p>
        </div>
      )}

      <div className="grid gap-3">
        {accounts.map((a) => (
          <Card key={a.id} className={a.isActive ? "" : "opacity-60"}>
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div className="flex items-center gap-4">
                <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    {!a.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{a.accountNumber}</p>
                  {a.bankName && <p className="text-xs text-muted-foreground">{a.bankName} · {a.currency}</p>}
                  {a.ledgerAccount && (
                    <p className="text-xs text-muted-foreground">GL: {a.ledgerAccount.code} {a.ledgerAccount.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {a.lastStatement && (
                  <Badge variant="outline" className={`text-xs ${STATUS_STYLES[a.lastStatement.status] ?? ""}`}>
                    {STATUS_LABELS[a.lastStatement.status] ?? a.lastStatement.status}
                  </Badge>
                )}
                <Link href={`/africs/accounting/bank-reconciliation/${a.id}`}>
                  <Button size="sm" variant="outline" className="gap-2">
                    Statements <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setEditAccount(a)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleToggle(a.id)} disabled={isPending}>
                      {a.isActive ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AccountDialog open={createOpen} onClose={() => setCreateOpen(false)} ledgerAccounts={ledgerAccounts} />
      {editAccount && (
        <AccountDialog
          open={true}
          onClose={() => setEditAccount(null)}
          ledgerAccounts={ledgerAccounts}
          initial={editAccount}
        />
      )}
    </>
  );
}
