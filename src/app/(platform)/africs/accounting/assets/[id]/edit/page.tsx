import { TopBar } from "@/components/layout/top-bar";
import { getAsset } from "@/lib/actions/assets";
import { AssetForm } from "@/components/assets/asset-form";
import { notFound } from "next/navigation";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();

  return (
    <div>
      <TopBar title="Edit Asset" subtitle={asset.assetNumber} />
      <div className="p-6 max-w-3xl">
        <AssetForm asset={asset} />
      </div>
    </div>
  );
}
