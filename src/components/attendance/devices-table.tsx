"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Trash2, Plus, Copy, Check } from "lucide-react";
import { createAttendanceDevice, deleteAttendanceDevice } from "@/lib/actions/attendance";

interface Device {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  location: string | null;
  apiKey: string;
  isActive: boolean;
  lastHeartbeat: Date | string | null;
  _count: { records: number };
}

interface Props {
  devices: Device[];
}

function AddDeviceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (apiKey: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("biometric");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError("Device name required"); return; }
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("type", type);
    fd.set("serialNumber", serialNumber);
    fd.set("location", location);
    const result = await createAttendanceDevice(fd);
    setSaving(false);
    if ("error" in result) { setError(result.error ?? "Failed"); return; }
    if ("apiKey" in result && result.apiKey) {
      onCreated(result.apiKey);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Attendance Device</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Device Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Entrance Biometric" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: string | null) => { if (v) setType(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="biometric">Biometric</SelectItem>
                  <SelectItem value="rfid">RFID Card</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                  <SelectItem value="pin">PIN</SelectItem>
                  <SelectItem value="face">Face Recognition</SelectItem>
                  <SelectItem value="manual">Manual (Software)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Serial Number</Label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Optional" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ground Floor Lobby" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Adding..." : "Add Device"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyDialog({ apiKey, open, onOpenChange }: { apiKey: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Device API Key</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Use this API key when configuring your device. Store it securely — it won&apos;t be shown again in full.
        </p>
        <div className="flex gap-2 items-center mt-2">
          <code className="flex-1 bg-muted rounded px-3 py-2 text-xs font-mono break-all">{apiKey}</code>
          <Button size="icon" variant="outline" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DevicesTable({ devices }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deletingId) return;
    await deleteAttendanceDevice(deletingId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{devices.length} device{devices.length !== 1 ? "s" : ""}</p>
          <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Add Device
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                    No devices registered. Add a device to start tracking attendance.
                  </TableCell>
                </TableRow>
              )}
              {devices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.serialNumber && <p className="text-xs text-muted-foreground font-mono">{d.serialNumber}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{d.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.location ?? "—"}</TableCell>
                  <TableCell>
                    <code className="text-xs font-mono text-muted-foreground">{d.apiKey.slice(0, 12)}…</code>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{d._count.records}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.lastHeartbeat
                      ? new Date(d.lastHeartbeat).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.isActive ? "default" : "secondary"} className="text-xs">
                      {d.isActive ? "Active" : "Inactive"}
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
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingId(d.id)}
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
      </div>

      <AddDeviceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(key) => { setNewApiKey(key); router.refresh(); }}
      />

      {newApiKey && (
        <ApiKeyDialog
          apiKey={newApiKey}
          open={!!newApiKey}
          onOpenChange={(v) => { if (!v) setNewApiKey(null); }}
        />
      )}

      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the device. Historical records will remain. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
