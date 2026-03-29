"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { deleteBenefitType } from "@/lib/actions/benefits";

const CATEGORY_LABELS: Record<string, string> = {
  medical: "Medical", pension: "Pension", allowance: "Allowance",
  insurance: "Insurance", loan: "Loan", other: "Other",
};

interface BenefitType {
  id: string; name: string; category: string; valueType: string;
  defaultValue: { toString(): string } | number | string | null;
  currency: string; description: string | null; isActive: boolean;
  _count: { benefits: number };
}

interface BenefitSummaryRow {
  id: string;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string; department: string | null };
  benefitType: { id: string; name: string; category: string; valueType: string; currency: string };
  overrideValue: { toString(): string } | number | string | null;
  effectiveFrom: Date | string;
  effectiveTo: Date | string | null;
}

interface Props {
  benefitTypes: BenefitType[];
  summary: BenefitSummaryRow[];
}

export function BenefitsPageClient({ benefitTypes, summary }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deletingId) return;
    await deleteBenefitType(deletingId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <>
      <Tabs defaultValue="types">
        <TabsList className="mb-4">
          <TabsTrigger value="types">Benefit Types ({benefitTypes.length})</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({summary.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Default Value</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefitTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No benefit types defined yet.
                    </TableCell>
                  </TableRow>
                )}
                {benefitTypes.map((bt) => (
                  <TableRow key={bt.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{bt.name}</p>
                      {bt.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{bt.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[bt.category] ?? bt.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {bt.defaultValue != null
                        ? `${bt.currency} ${parseFloat(bt.defaultValue.toString()).toLocaleString()}${bt.valueType === "percentage" ? "%" : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{bt._count.benefits}</TableCell>
                    <TableCell>
                      <Badge variant={bt.isActive ? "default" : "secondary"} className="text-xs">
                        {bt.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/africs/hr/benefits/${bt.id}/edit`} />}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingId(bt.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          {summary.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No benefits assigned yet. Go to an employee profile to assign benefits.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Benefit</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{row.employee.firstName} {row.employee.lastName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{row.employee.employeeNumber}</p>
                      </TableCell>
                      <TableCell className="text-sm">{row.benefitType.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[row.benefitType.category] ?? row.benefitType.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.overrideValue != null
                          ? `${row.benefitType.currency} ${parseFloat(row.overrideValue.toString()).toLocaleString()}`
                          : <span className="text-muted-foreground text-xs">Default</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.effectiveFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Ongoing"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Benefit Type</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the benefit type and all employee assignments. Cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
