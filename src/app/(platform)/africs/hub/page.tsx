import { TopBar } from "@/components/layout/top-bar";

export default function HubPage() {
  return (
    <div>
      <TopBar title="Hub" subtitle="Quick-launch dashboard for apps and services" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Hub coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
