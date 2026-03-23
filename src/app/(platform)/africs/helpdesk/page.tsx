import { TopBar } from "@/components/layout/top-bar";

export default function HelpdeskPage() {
  return (
    <div>
      <TopBar title="Helpdesk" subtitle="Support tickets and issue tracking" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Helpdesk module coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
