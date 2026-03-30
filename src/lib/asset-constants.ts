export const ASSET_CATEGORIES = {
  equipment:       { label: "Equipment",       icon: "⚙️" },
  furniture:       { label: "Furniture",       icon: "🪑" },
  vehicles:        { label: "Vehicles",        icon: "🚗" },
  it:              { label: "IT",              icon: "💻" },
  intangibles:     { label: "Intangibles",     icon: "✨" },
  office_supplies: { label: "Office Supplies", icon: "📎" },
  other:           { label: "Other",           icon: "📦" },
  // legacy aliases (existing seed data)
  vehicle:         { label: "Vehicles",        icon: "🚗" },
  technology:      { label: "IT",              icon: "💻" },
} as const;

export const ASSET_STATUSES = {
  active:         { label: "Active",         color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  in_maintenance: { label: "In Maintenance", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  disposed:       { label: "Disposed",       color: "text-zinc-500 border-zinc-500/30 bg-zinc-500/10" },
  lost:           { label: "Lost",           color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  retired:        { label: "Retired",        color: "text-muted-foreground border-border" },
} as const;

export const ASSET_CONDITIONS = {
  new:  { label: "New",  color: "text-emerald-400" },
  good: { label: "Good", color: "text-blue-400" },
  fair: { label: "Fair", color: "text-amber-400" },
  poor: { label: "Poor", color: "text-rose-400" },
} as const;

export const DEPRECIATION_METHODS = {
  straight_line:            { label: "Straight-Line" },
  double_declining_balance: { label: "Double-Declining Balance" },
  units_of_activity:        { label: "Units of Activity" },
  none:                     { label: "None" },
  // legacy alias
  declining_balance:        { label: "Declining Balance" },
} as const;

export const MAINTENANCE_STATUSES = {
  scheduled:   { label: "Scheduled",   color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  in_progress: { label: "In Progress", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  completed:   { label: "Completed",   color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
} as const;

export type AssetCategory = keyof typeof ASSET_CATEGORIES;
export type AssetStatus = keyof typeof ASSET_STATUSES;
export type AssetCondition = keyof typeof ASSET_CONDITIONS;
export type DepreciationMethod = keyof typeof DEPRECIATION_METHODS;
export type MaintenanceStatus = keyof typeof MAINTENANCE_STATUSES;

export function calculateCurrentValue(asset: {
  purchasePrice: number;
  salvageValue: number;
  usefulLifeMonths: number | null;
  depreciationMethod: string | null;
  purchaseDate: string | null;
}): number {
  if (!asset.depreciationMethod || asset.depreciationMethod === "none") return asset.purchasePrice;
  if (!asset.purchaseDate || !asset.usefulLifeMonths || asset.usefulLifeMonths <= 0) return asset.purchasePrice;

  const purchase = new Date(asset.purchaseDate);
  const now = new Date();
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth()),
  );

  if (asset.depreciationMethod === "straight_line") {
    const monthly = (asset.purchasePrice - asset.salvageValue) / asset.usefulLifeMonths;
    return Math.max(asset.salvageValue, asset.purchasePrice - monthly * monthsElapsed);
  }

  if (asset.depreciationMethod === "declining_balance") {
    const rate = 1 - Math.pow(asset.salvageValue / asset.purchasePrice, 1 / asset.usefulLifeMonths);
    return Math.max(asset.salvageValue, asset.purchasePrice * Math.pow(1 - rate, monthsElapsed));
  }

  return asset.purchasePrice;
}
