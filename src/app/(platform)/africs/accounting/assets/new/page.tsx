import { TopBar } from "@/components/layout/top-bar";
import { AssetForm } from "@/components/assets/asset-form";

export default function NewAssetPage() {
  return (
    <div>
      <TopBar title="Add Asset" subtitle="Register a new company asset" />
      <div className="p-6 max-w-3xl">
        <AssetForm />
      </div>
    </div>
  );
}
