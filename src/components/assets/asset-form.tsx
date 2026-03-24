"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAsset, updateAsset } from "@/lib/actions/assets";
import { ASSET_CATEGORIES, ASSET_CONDITIONS, DEPRECIATION_METHODS } from "@/lib/asset-constants";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  category: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  location: string | null;
  purchaseDate: string | null;
  purchasePrice: number;
  currency: string;
  warrantyExpiry: string | null;
  condition: string;
  depreciationMethod: string | null;
  usefulLifeMonths: number | null;
  salvageValue: number;
  notes: string | null;
}

interface Props {
  asset?: Asset;
}

export function AssetForm({ asset }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = asset
        ? await updateAsset(asset.id, fd)
        : await createAsset(fd);

      if (result && "error" in result) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      if (result && "id" in result) {
        router.push(`/africs/accounting/assets/${result.id}`);
      } else {
        router.push(`/africs/accounting/assets/${asset!.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="name">Asset Name *</Label>
              <Input id="name" name="name" defaultValue={asset?.name} required placeholder="e.g. Dell Laptop 15-inch" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={asset?.category ?? "equipment"}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="condition">Condition</Label>
              <Select name="condition" defaultValue={asset?.condition ?? "good"}>
                <SelectTrigger id="condition"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_CONDITIONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={asset?.brand ?? ""} placeholder="e.g. Dell" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" defaultValue={asset?.model ?? ""} placeholder="e.g. Latitude 5520" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" name="serialNumber" defaultValue={asset?.serialNumber ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={asset?.location ?? ""} placeholder="e.g. Head Office, Floor 2" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={asset?.description ?? ""} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Purchase &amp; Value</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={asset?.currency ?? "GMD"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input id="purchasePrice" name="purchasePrice" type="number" min="0" step="any" defaultValue={asset?.purchasePrice || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={asset?.purchaseDate ? asset.purchaseDate.substring(0, 10) : ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input id="warrantyExpiry" name="warrantyExpiry" type="date" defaultValue={asset?.warrantyExpiry ? asset.warrantyExpiry.substring(0, 10) : ""} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Depreciation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="depreciationMethod">Method</Label>
              <Select name="depreciationMethod" defaultValue={asset?.depreciationMethod ?? "none"}>
                <SelectTrigger id="depreciationMethod"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPRECIATION_METHODS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usefulLifeMonths">Useful Life (months)</Label>
              <Input id="usefulLifeMonths" name="usefulLifeMonths" type="number" min="1" step="1" defaultValue={asset?.usefulLifeMonths ?? ""} placeholder="e.g. 60" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salvageValue">Salvage Value</Label>
              <Input id="salvageValue" name="salvageValue" type="number" min="0" step="any" defaultValue={asset?.salvageValue || ""} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={asset?.notes ?? ""} rows={2} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : asset ? "Save Changes" : "Add Asset"}
        </Button>
      </div>
    </form>
  );
}
