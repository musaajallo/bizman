"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, BookTemplate, MoreHorizontal, Trash2, Play, RefreshCw, ChevronDown, ChevronRight, AlertCircle,
} from "lucide-react";
import { AdjustingEntryDialog } from "./adjusting-entry-dialog";
import { AdjustingTemplateDialog } from "./adjusting-template-dialog";
import {
  deleteAdjustingTemplate,
  postFromTemplate,
  ADJUSTMENT_TYPE_LABELS,
} from "@/lib/actions/accounting/adjusting-entries";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface EntryLine {
  id: string;
  debit: number;
  credit: number;
  description: string | null;
  account: { code: string; name: string; type: string };
}

interface Entry {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  isReversing: boolean;
  reversesId: string | null;
  period: { name: string };
  lines: EntryLine[];
}

interface Template {
  id: string;
  name: string;
  type: string;
  amount: number;
  description: string;
  isReversing: boolean;
  debitAccount:  { id: string; code: string; name: string };
  creditAccount: { id: string; code: string; name: string };
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Period {
  id: string;
  name: string;
}

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debitBalance: number;
  creditBalance: number;
}

interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
}

interface Props {
  entries:      Entry[];
  templates:    Template[];
  accounts:     Account[];
  periods:      Period[];
  adjustedTB:   TrialBalance;
  unadjustedTB: TrialBalance;
}

export function AdjustingEntriesClient({
  entries, templates, accounts, periods, adjustedTB, unadjustedTB,
}: Props) {
  const router = useRouter();
  const [entryDialog, setEntryDialog]       = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [postingId, setPostingId]           = useState<string | null>(null);
  const [postDate, setPostDate]             = useState(new Date().toISOString().split("T")[0]);
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [tbTab, setTbTab]                   = useState<"adjusted" | "unadjusted">("adjusted");
  const [actionError, setActionError]       = useState<string | null>(null);
  const [isPending, startTransition]        = useTransition();

  const tb = tbTab === "adjusted" ? adjustedTB : unadjustedTB;

  function handleDeleteTemplate(id: string) {
    startTransition(async () => {
      const res = await deleteAdjustingTemplate(id);
      if (res.error) { setActionError(res.error); return; }
      router.refresh();
      setDeleteId(null);
    });
  }

  function handlePostFromTemplate(id: string) {
    startTransition(async () => {
      const res = await postFromTemplate({ templateId: id, date: postDate });
      if (res.error) { setActionError(res.error); return; }
      router.refresh();
      setPostingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{actionError}
          <button className="ml-auto text-xs" onClick={() => setActionError(null)}>✕</button>
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{entries.length} adjusting {entries.length === 1 ? "entry" : "entries"} posted</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTemplateDialog(true)}>
            <BookTemplate className="h-3.5 w-3.5" />New Template
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setEntryDialog(true)}>
            <Plus className="h-3.5 w-3.5" />New Adjusting Entry
          </Button>
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recurring Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-secondary/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {ADJUSTMENT_TYPE_LABELS[t.type as keyof typeof ADJUSTMENT_TYPE_LABELS]}
                      </Badge>
                      {t.isReversing && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          <RefreshCw className="h-3 w-3 mr-1" />Reversing
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      DR <span className="font-mono">{t.debitAccount.code}</span> {t.debitAccount.name}
                      {" / "}CR <span className="font-mono">{t.creditAccount.code}</span> {t.creditAccount.name}
                      {" · "}<span className="font-mono">{fmt(t.amount)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {postingId === t.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={postDate}
                          onChange={(e) => setPostDate(e.target.value)}
                          className="h-8 text-xs border rounded px-2 bg-background"
                        />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handlePostFromTemplate(t.id)} disabled={isPending}>Post</Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setPostingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setPostingId(t.id)}>
                        <Play className="h-3 w-3" />Post
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete Template
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Posted Adjusting Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No adjusting entries yet. Use the button above to post period-end adjustments.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Period</TableHead>
                  <TableHead className="text-xs">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <>
                    <TableRow
                      key={e.id}
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                    >
                      <TableCell className="py-2">
                        {expandedId === e.id
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </TableCell>
                      <TableCell className="py-2 font-mono text-xs">
                        {new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        <span>{e.description}</span>
                        {e.reference && <span className="ml-2 text-xs text-muted-foreground font-mono">{e.reference}</span>}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{e.period.name}</TableCell>
                      <TableCell className="py-2">
                        {e.isReversing && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                            <RefreshCw className="h-3 w-3 mr-1" />Reversing
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === e.id && (
                      <TableRow key={`${e.id}-lines`} className="bg-secondary/20">
                        <TableCell colSpan={5} className="py-0">
                          <div className="py-2 pl-10">
                            <table className="text-xs w-full">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left font-normal pb-1 w-24">Code</th>
                                  <th className="text-left font-normal pb-1">Account</th>
                                  <th className="text-right font-normal pb-1 w-28">Debit</th>
                                  <th className="text-right font-normal pb-1 w-28">Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {e.lines.map((l) => (
                                  <tr key={l.id}>
                                    <td className="font-mono py-0.5">{l.account.code}</td>
                                    <td className="py-0.5">{l.account.name}</td>
                                    <td className="text-right font-mono tabular-nums py-0.5">
                                      {l.debit > 0 ? fmt(l.debit) : ""}
                                    </td>
                                    <td className="text-right font-mono tabular-nums py-0.5">
                                      {l.credit > 0 ? fmt(l.credit) : ""}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trial Balance toggle */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Trial Balance</CardTitle>
          <Tabs value={tbTab} onValueChange={(v) => setTbTab(v as "adjusted" | "unadjusted")}>
            <TabsList className="h-7">
              <TabsTrigger value="adjusted" className="text-xs h-6 px-3">Adjusted</TabsTrigger>
              <TabsTrigger value="unadjusted" className="text-xs h-6 px-3">Unadjusted</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Account</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-right text-xs">Debit</TableHead>
                <TableHead className="text-right text-xs">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tb.rows.map((r) => (
                <TableRow key={r.code}>
                  <TableCell className="font-mono text-xs py-1.5">{r.code}</TableCell>
                  <TableCell className="text-sm py-1.5">{r.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground py-1.5">{r.type}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm py-1.5">
                    {r.debitBalance > 0 ? fmt(r.debitBalance) : ""}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm py-1.5">
                    {r.creditBalance > 0 ? fmt(r.creditBalance) : ""}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold bg-secondary/20">
                <TableCell colSpan={3} className="text-sm py-2">Totals</TableCell>
                <TableCell className="text-right font-mono tabular-nums py-2">{fmt(tb.totalDebits)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums py-2">{fmt(tb.totalCredits)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="py-2 text-center">
                  <Badge variant="outline" className={tb.balanced
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                  }>
                    {tb.balanced ? "Balanced" : "⚠ Out of balance"}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AdjustingEntryDialog
        open={entryDialog}
        onOpenChange={setEntryDialog}
        accounts={accounts}
      />
      <AdjustingTemplateDialog
        open={templateDialog}
        onOpenChange={setTemplateDialog}
        accounts={accounts}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This template will be removed. Posted entries from this template are not affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteId && handleDeleteTemplate(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
