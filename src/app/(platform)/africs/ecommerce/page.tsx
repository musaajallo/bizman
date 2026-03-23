import { TopBar } from "@/components/layout/top-bar";

export default function ECommercePage() {
  return (
    <div>
      <TopBar title="eCommerce" subtitle="Online store and order management" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            eCommerce module coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
