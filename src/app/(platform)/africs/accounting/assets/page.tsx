import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { getAssets, getAssetStats } from "@/lib/actions/assets";
import { AssetStatsCards } from "@/components/assets/asset-stats-cards";
import { AssetListTable } from "@/components/assets/asset-list-table";
import { Plus } from "lucide-react";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}) {
  const filters = await searchParams;
  const [stats, assets] = await Promise.all([getAssetStats(), getAssets(filters)]);

  return (
    <div>
      <TopBar
        title="Assets"
        subtitle="Track and manage company assets"
        actions={
          <Link href="/africs/accounting/assets/new">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Asset</Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        <AssetStatsCards stats={stats} />
        <AssetListTable assets={assets} />
      </div>
    </div>
  );
}
