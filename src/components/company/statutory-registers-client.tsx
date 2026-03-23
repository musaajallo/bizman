"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2, UserRound, Building2 } from "lucide-react";
import {
  createDirector,
  updateDirector,
  deleteDirector,
  createShareholder,
  updateShareholder,
  deleteShareholder,
} from "@/lib/actions/statutory-registers";

interface Director {
  id: string;
  fullName: string;
  title: string | null;
  designation: string;
  nationality: string | null;
  idNumber: string | null;
  email: string | null;
  phone: string | null;
  residentialAddress: string | null;
  dateOfBirth: string | null;
  appointmentDate: string;
  cessationDate: string | null;
  cessationReason: string | null;
  shareholding: number | null;
  notes: string | null;
}

interface Shareholder {
  id: string;
  name: string;
  type: string;
  nationality: string | null;
  idNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  sharesHeld: number;
  shareClass: string;
  nominalValue: number | null;
  percentageHeld: number;
  dateAcquired: string;
  dateCeased: string | null;
  transferDetails: string | null;
  notes: string | null;
}

interface Props {
  directors: Director[];
  shareholders: Shareholder[];
}

const DESIGNATIONS = ["Director", "Managing Director", "Executive Director", "Non-Executive Director", "Chairman", "Secretary"];
const CESSATION_REASONS = ["resigned", "removed", "deceased", "term_expired"];
const SHAREHOLDER_TYPES = ["individual", "corporate", "trust", "nominee"];
const SHARE_CLASSES = ["Ordinary", "Preference", "Redeemable", "Non-Voting"];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function toInputDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

// ─── Director Form Dialog ────────────────────────────────────

function DirectorDialog({
  open,
  onOpenChange,
  director,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  director?: Director;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!director;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit
        ? await updateDirector(director.id, formData)
        : await createDirector(formData);
      if (result.success) onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Director" : "Add Director"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update director details." : "Add a new entry to the Register of Directors."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-title">Title</Label>
              <Select name="title" defaultValue={director?.title || ""}>
                <SelectTrigger id="d-title"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Mr", "Mrs", "Ms", "Dr", "Prof", "Eng"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-designation">Designation</Label>
              <Select name="designation" defaultValue={director?.designation || "Director"}>
                <SelectTrigger id="d-designation"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-fullName">Full Name *</Label>
            <Input id="d-fullName" name="fullName" required defaultValue={director?.fullName || ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-nationality">Nationality</Label>
              <Input id="d-nationality" name="nationality" defaultValue={director?.nationality || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-idNumber">ID / Passport No.</Label>
              <Input id="d-idNumber" name="idNumber" defaultValue={director?.idNumber || ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-email">Email</Label>
              <Input id="d-email" name="email" type="email" defaultValue={director?.email || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-phone">Phone</Label>
              <Input id="d-phone" name="phone" defaultValue={director?.phone || ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-residentialAddress">Residential Address</Label>
            <Input id="d-residentialAddress" name="residentialAddress" defaultValue={director?.residentialAddress || ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-dateOfBirth">Date of Birth</Label>
              <Input id="d-dateOfBirth" name="dateOfBirth" type="date" defaultValue={toInputDate(director?.dateOfBirth ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-appointmentDate">Appointment Date *</Label>
              <Input id="d-appointmentDate" name="appointmentDate" type="date" required defaultValue={toInputDate(director?.appointmentDate ?? null)} />
            </div>
          </div>
          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-cessationDate">Cessation Date</Label>
                <Input id="d-cessationDate" name="cessationDate" type="date" defaultValue={toInputDate(director?.cessationDate ?? null)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-cessationReason">Reason</Label>
                <Select name="cessationReason" defaultValue={director?.cessationReason || ""}>
                  <SelectTrigger id="d-cessationReason"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CESSATION_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="d-shareholding">Shareholding (%)</Label>
            <Input id="d-shareholding" name="shareholding" type="number" step="0.01" min="0" max="100" defaultValue={director?.shareholding ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-notes">Notes</Label>
            <Input id="d-notes" name="notes" defaultValue={director?.notes || ""} />
          </div>
          <DialogFooter>
            <DialogClose>
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Update" : "Add Director"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shareholder Form Dialog ─────────────────────────────────

function ShareholderDialog({
  open,
  onOpenChange,
  shareholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareholder?: Shareholder;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!shareholder;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit
        ? await updateShareholder(shareholder.id, formData)
        : await createShareholder(formData);
      if (result.success) onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shareholder" : "Add Shareholder"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update shareholder details." : "Add a new entry to the Register of Members."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Name *</Label>
              <Input id="s-name" name="name" required defaultValue={shareholder?.name || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-type">Type</Label>
              <Select name="type" defaultValue={shareholder?.type || "individual"}>
                <SelectTrigger id="s-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHAREHOLDER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-nationality">Nationality</Label>
              <Input id="s-nationality" name="nationality" defaultValue={shareholder?.nationality || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-idNumber">ID / Reg. No.</Label>
              <Input id="s-idNumber" name="idNumber" defaultValue={shareholder?.idNumber || ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" name="email" type="email" defaultValue={shareholder?.email || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Phone</Label>
              <Input id="s-phone" name="phone" defaultValue={shareholder?.phone || ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-address">Address</Label>
            <Input id="s-address" name="address" defaultValue={shareholder?.address || ""} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-sharesHeld">Shares Held *</Label>
              <Input id="s-sharesHeld" name="sharesHeld" type="number" min="1" required defaultValue={shareholder?.sharesHeld ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-shareClass">Share Class</Label>
              <Select name="shareClass" defaultValue={shareholder?.shareClass || "Ordinary"}>
                <SelectTrigger id="s-shareClass"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHARE_CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-nominalValue">Nominal Value</Label>
              <Input id="s-nominalValue" name="nominalValue" type="number" step="0.01" min="0" defaultValue={shareholder?.nominalValue ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-percentageHeld">Ownership (%) *</Label>
              <Input id="s-percentageHeld" name="percentageHeld" type="number" step="0.01" min="0" max="100" required defaultValue={shareholder?.percentageHeld ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-dateAcquired">Date Acquired *</Label>
              <Input id="s-dateAcquired" name="dateAcquired" type="date" required defaultValue={toInputDate(shareholder?.dateAcquired ?? null)} />
            </div>
          </div>
          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="s-dateCeased">Date Ceased</Label>
              <Input id="s-dateCeased" name="dateCeased" type="date" defaultValue={toInputDate(shareholder?.dateCeased ?? null)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="s-transferDetails">Transfer Details</Label>
            <Input id="s-transferDetails" name="transferDetails" defaultValue={shareholder?.transferDetails || ""} placeholder="How shares were acquired or transferred" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-notes">Notes</Label>
            <Input id="s-notes" name="notes" defaultValue={shareholder?.notes || ""} />
          </div>
          <DialogFooter>
            <DialogClose>
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Update" : "Add Shareholder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function StatutoryRegistersClient({ directors, shareholders }: Props) {
  const [directorDialog, setDirectorDialog] = useState<{ open: boolean; director?: Director }>({ open: false });
  const [shareholderDialog, setShareholderDialog] = useState<{ open: boolean; shareholder?: Shareholder }>({ open: false });
  const [deleting, startDelete] = useTransition();

  const activeDirectors = directors.filter((d) => !d.cessationDate);
  const formerDirectors = directors.filter((d) => d.cessationDate);
  const activeShareholders = shareholders.filter((s) => !s.dateCeased);
  const formerShareholders = shareholders.filter((s) => s.dateCeased);
  const totalShares = activeShareholders.reduce((sum, s) => sum + s.sharesHeld, 0);

  return (
    <>
      <Tabs defaultValue="directors">
        <TabsList>
          <TabsTrigger value="directors" className="gap-1.5">
            <UserRound className="h-3.5 w-3.5" />
            Register of Directors
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{activeDirectors.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shareholders" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Register of Members
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{activeShareholders.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ─── Directors Tab ─── */}
        <TabsContent value="directors" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Statutory register of company directors and officers.
            </p>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setDirectorDialog({ open: true })}>
              <Plus className="h-3.5 w-3.5" /> Add Director
            </Button>
          </div>

          {activeDirectors.length === 0 && formerDirectors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No directors registered yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeDirectors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Current Directors ({activeDirectors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Designation</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Appointed</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nationality</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Shares %</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeDirectors.map((d) => (
                            <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2.5">
                                <div>
                                  <span className="font-medium">{d.title ? `${d.title} ` : ""}{d.fullName}</span>
                                  {d.email && <p className="text-xs text-muted-foreground">{d.email}</p>}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">{d.designation}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{formatDate(d.appointmentDate)}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{d.nationality || "—"}</td>
                              <td className="px-3 py-2.5 text-right font-mono">{d.shareholding != null ? `${d.shareholding}%` : "—"}</td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDirectorDialog({ open: true, director: d })}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    disabled={deleting}
                                    onClick={() => {
                                      if (confirm(`Remove ${d.fullName} from the register?`)) {
                                        startDelete(async () => { await deleteDirector(d.id); });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {formerDirectors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Former Directors ({formerDirectors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Designation</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Appointed</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ceased</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Reason</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formerDirectors.map((d) => (
                            <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors opacity-70">
                              <td className="px-3 py-2.5">
                                <span className="font-medium">{d.title ? `${d.title} ` : ""}{d.fullName}</span>
                              </td>
                              <td className="px-3 py-2.5">{d.designation}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{formatDate(d.appointmentDate)}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{formatDate(d.cessationDate)}</td>
                              <td className="px-3 py-2.5">
                                {d.cessationReason && (
                                  <Badge variant="secondary" className="text-[10px]">{d.cessationReason.replace("_", " ")}</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDirectorDialog({ open: true, director: d })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── Shareholders Tab ─── */}
        <TabsContent value="shareholders" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Statutory register of members (shareholders) and share allocations.
            </p>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShareholderDialog({ open: true })}>
              <Plus className="h-3.5 w-3.5" /> Add Shareholder
            </Button>
          </div>

          {activeShareholders.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-[11px] text-muted-foreground">Total Shareholders</p>
                  <p className="text-lg font-semibold">{activeShareholders.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-[11px] text-muted-foreground">Total Shares Issued</p>
                  <p className="text-lg font-semibold font-mono">{totalShares.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-[11px] text-muted-foreground">Ownership Allocated</p>
                  <p className="text-lg font-semibold font-mono">
                    {activeShareholders.reduce((sum, s) => sum + Number(s.percentageHeld), 0).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeShareholders.length === 0 && formerShareholders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No shareholders registered yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeShareholders.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Current Shareholders ({activeShareholders.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Class</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Shares</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Ownership</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Acquired</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeShareholders.map((s) => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2.5">
                                <div>
                                  <span className="font-medium">{s.name}</span>
                                  {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <Badge variant="secondary" className="text-[10px]">{s.type}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">{s.shareClass}</td>
                              <td className="px-3 py-2.5 text-right font-mono">{s.sharesHeld.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-right font-mono font-medium">{Number(s.percentageHeld).toFixed(2)}%</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{formatDate(s.dateAcquired)}</td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShareholderDialog({ open: true, shareholder: s })}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    disabled={deleting}
                                    onClick={() => {
                                      if (confirm(`Remove ${s.name} from the register?`)) {
                                        startDelete(async () => { await deleteShareholder(s.id); });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {formerShareholders.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Former Shareholders ({formerShareholders.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Shares</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Acquired</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ceased</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formerShareholders.map((s) => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors opacity-70">
                              <td className="px-3 py-2.5 font-medium">{s.name}</td>
                              <td className="px-3 py-2.5">
                                <Badge variant="secondary" className="text-[10px]">{s.type}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono">{s.sharesHeld.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{formatDate(s.dateAcquired)}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{formatDate(s.dateCeased)}</td>
                              <td className="px-3 py-2.5 text-right">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShareholderDialog({ open: true, shareholder: s })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DirectorDialog
        open={directorDialog.open}
        onOpenChange={(open) => setDirectorDialog({ open, director: open ? directorDialog.director : undefined })}
        director={directorDialog.director}
      />
      <ShareholderDialog
        open={shareholderDialog.open}
        onOpenChange={(open) => setShareholderDialog({ open, shareholder: open ? shareholderDialog.shareholder : undefined })}
        shareholder={shareholderDialog.shareholder}
      />
    </>
  );
}
