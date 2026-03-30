import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetStatusBadge, AssetConditionBadge } from "./asset-status-badge";
import { Separator } from "@/components/ui/separator";
import { ASSET_CATEGORIES, DEPRECIATION_METHODS } from "@/lib/asset-constants";
import Link from "next/link";

interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  condition: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  location: string | null;
  purchaseDate: string | null;
  purchasePrice: number;
  currency: string;
  warrantyExpiry: string | null;
  currentValue: number;
  depreciationMethod: string | null;
  usefulLifeMonths: number | null;
  salvageValue: number;
  notes: string | null;
  purchaseOrder: { id: string; poNumber: string } | null;
  disposedAt?: string | null;
  disposalProceeds?: number;
  disposalNotes?: string | null;
}

export function AssetDetailCard({ asset, accumulatedDepreciation = 0 }: { asset: Asset; accumulatedDepreciation?: number }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const bookValue = asset.purchasePrice - accumulatedDepreciation;
  const catLabel = ASSET_CATEGORIES[asset.category as keyof typeof ASSET_CATEGORIES]?.label ?? asset.category;
  const deprLabel = asset.depreciationMethod
    ? DEPRECIATION_METHODS[asset.depreciationMethod as keyof typeof DEPRECIATION_METHODS]?.label ?? asset.depreciationMethod
    : "None";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground mb-1">{asset.assetNumber}</p>
            <CardTitle className="text-xl">{asset.name}</CardTitle>
            {asset.description && <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <AssetStatusBadge status={asset.status} />
            <AssetConditionBadge condition={asset.condition} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Category</dt>
            <dd className="font-medium mt-0.5">{catLabel}</dd>
          </div>
          {asset.brand && (
            <div>
              <dt className="text-xs text-muted-foreground">Brand / Model</dt>
              <dd className="font-medium mt-0.5">{asset.brand}{asset.model ? ` — ${asset.model}` : ""}</dd>
            </div>
          )}
          {asset.serialNumber && (
            <div>
              <dt className="text-xs text-muted-foreground">Serial Number</dt>
              <dd className="font-mono text-xs mt-0.5">{asset.serialNumber}</dd>
            </div>
          )}
          {asset.location && (
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="font-medium mt-0.5">{asset.location}</dd>
            </div>
          )}
          {asset.purchaseDate && (
            <div>
              <dt className="text-xs text-muted-foreground">Purchase Date</dt>
              <dd className="font-medium mt-0.5">{fmt(asset.purchaseDate)}</dd>
            </div>
          )}
          {asset.purchasePrice > 0 && (
            <div>
              <dt className="text-xs text-muted-foreground">Purchase Price (Cost)</dt>
              <dd className="font-medium mt-0.5">{asset.currency} {asset.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
            </div>
          )}
          {accumulatedDepreciation > 0 && (
            <div>
              <dt className="text-xs text-muted-foreground">Accumulated Depreciation</dt>
              <dd className="font-medium mt-0.5 text-amber-400">({asset.currency} {accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })})</dd>
            </div>
          )}
          {accumulatedDepreciation > 0 && (
            <div>
              <dt className="text-xs text-muted-foreground">Book Value (Net)</dt>
              <dd className="font-medium mt-0.5">{asset.currency} {Math.max(0, bookValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
            </div>
          )}
          {asset.status === "disposed" && asset.disposedAt && (
            <div>
              <dt className="text-xs text-muted-foreground">Disposed On</dt>
              <dd className="font-medium mt-0.5 text-muted-foreground">{fmt(asset.disposedAt)}</dd>
            </div>
          )}
          {asset.status === "disposed" && (
            <div>
              <dt className="text-xs text-muted-foreground">Disposal Proceeds</dt>
              <dd className="font-medium mt-0.5">{asset.currency} {(asset.disposalProceeds ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
            </div>
          )}
          {asset.warrantyExpiry && (
            <div>
              <dt className="text-xs text-muted-foreground">Warranty Expiry</dt>
              <dd className="font-medium mt-0.5">{fmt(asset.warrantyExpiry)}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">Depreciation</dt>
            <dd className="font-medium mt-0.5">{deprLabel}{asset.usefulLifeMonths ? ` / ${asset.usefulLifeMonths}mo` : ""}</dd>
          </div>
          {asset.purchaseOrder && (
            <div>
              <dt className="text-xs text-muted-foreground">Purchase Order</dt>
              <dd className="mt-0.5">
                <Link href={`/africs/accounting/procurement/orders/${asset.purchaseOrder.id}`} className="text-primary hover:underline font-mono text-xs">
                  {asset.purchaseOrder.poNumber}
                </Link>
              </dd>
            </div>
          )}
        </dl>
        {asset.notes && (
          <>
            <Separator className="my-4" />
            <div className="text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p>{asset.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
