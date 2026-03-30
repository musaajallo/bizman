import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getAssets, getAssetStats, getOpenPeriods } from "@/lib/actions/assets";
import { AssetStatsCards } from "@/components/assets/asset-stats-cards";
import { AssetListTable } from "@/components/assets/asset-list-table";
import { AssetRunDepreciationDialog } from "@/components/assets/asset-run-depreciation-dialog";
import { ASSET_CATEGORIES, ASSET_STATUSES } from "@/lib/asset-constants";
import { Plus, Download } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "All" },
  ...Object.entries(ASSET_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...Object.entries(ASSET_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })),
];

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}) {
  const filters = await searchParams;
  const [stats, assets, openPeriods] = await Promise.all([getAssetStats(), getAssets(filters), getOpenPeriods()]);

  const activeStatus = filters.status ?? "";
  const activeCategory = filters.category ?? "";

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { status: activeStatus, category: activeCategory, ...overrides };
    if (merged.status) params.set("status", merged.status);
    if (merged.category) params.set("category", merged.category);
    const qs = params.toString();
    return `/africs/accounting/assets${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <TopBar
        title="Assets"
        subtitle="Track and manage company assets"
        actions={
          <div className="flex items-center gap-2">
            <AssetRunDepreciationDialog periods={openPeriods} />
            <a href="/api/assets/export" download>
              <Button size="sm" variant="outline" className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
            </a>
            <Link href="/africs/accounting/assets/new">
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Asset</Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <AssetStatsCards stats={stats} />

        {/* Status filter tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-0">
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={buildHref({ status: tab.value })}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 pb-2">
            <div className="flex gap-1 flex-wrap">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = activeCategory === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={buildHref({ category: opt.value })}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <AssetListTable assets={assets} />
      </div>
    </div>
  );
}
