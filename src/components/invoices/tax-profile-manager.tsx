"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, CheckCircle2, Star } from "lucide-react";
import { createTaxProfile, updateTaxProfile, deleteTaxProfile } from "@/lib/actions/tax-profiles";

interface TaxProfile {
  id: string;
  name: string;
  rate: number;
  description: string | null;
  isDefault: boolean;
}

interface Props {
  profiles: TaxProfile[];
}

export function TaxProfileManager({ profiles: initial }: Props) {
  const [profiles, setProfiles] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function flash(err?: string) {
    if (err) { setError(err); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await createTaxProfile(fd);
      if ("error" in res) { flash(res.error); return; }
      // optimistic: server will revalidate
      setShowAdd(false);
      flash();
    });
  }

  function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await updateTaxProfile(id, fd);
      if ("error" in res) { flash(res.error); return; }
      setEditId(null);
      flash();
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteTaxProfile(id);
      if ("error" in res) { flash(res.error); return; }
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    });
  }

  const ProfileForm = ({
    onSubmit,
    defaultValues,
    onCancel,
  }: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    defaultValues?: TaxProfile;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-end p-3 bg-muted/30 rounded-md border">
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input name="name" defaultValue={defaultValues?.name} placeholder="e.g. VAT (15%)" className="h-8 text-sm" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Rate (%)</Label>
        <Input name="rate" type="number" defaultValue={defaultValues?.rate} min="0" max="100" step="0.01" placeholder="0.00" className="h-8 w-24 text-sm" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description (optional)</Label>
        <Input name="description" defaultValue={defaultValues?.description ?? ""} placeholder="e.g. Standard rate" className="h-8 text-sm" />
      </div>
      <div className="flex items-center gap-1.5 pb-0.5">
        <input type="hidden" name="isDefault" value="false" />
        <input
          type="checkbox"
          id={`default-${defaultValues?.id ?? "new"}`}
          name="isDefault"
          value="true"
          defaultChecked={defaultValues?.isDefault}
          className="accent-primary"
        />
        <label htmlFor={`default-${defaultValues?.id ?? "new"}`} className="text-xs text-muted-foreground">Default</label>
      </div>
      <div className="sm:col-span-4 flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending} className="h-7 text-xs gap-1">
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {defaultValues ? "Save" : "Add Profile"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-3">
      {profiles.length > 0 && (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Rate</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                editId === p.id ? (
                  <tr key={p.id}>
                    <td colSpan={4} className="px-2 py-2">
                      <ProfileForm
                        onSubmit={(e) => handleUpdate(p.id, e)}
                        defaultValues={p}
                        onCancel={() => setEditId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5 font-medium flex items-center gap-2">
                      {p.name}
                      {p.isDefault && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px] gap-0.5 text-amber-400 border-amber-500/30">
                          <Star className="h-2.5 w-2.5" />default
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">{p.rate}%</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{p.description ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditId(p.id)}>Edit</Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd ? (
        <ProfileForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      ) : (
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Profile
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />Saved
        </p>
      )}
    </div>
  );
}
