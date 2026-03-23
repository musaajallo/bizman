import { TopBar } from "@/components/layout/top-bar";

export default function AssetsPage() {
  return (
    <div>
      <TopBar title="Assets" subtitle="Track and manage company assets and equipment" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Asset management module coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
