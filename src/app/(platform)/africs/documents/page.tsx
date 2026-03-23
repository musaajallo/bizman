import { TopBar } from "@/components/layout/top-bar";

export default function DocumentsPage() {
  return (
    <div>
      <TopBar title="Documents" subtitle="File storage and document management" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Documents module coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
