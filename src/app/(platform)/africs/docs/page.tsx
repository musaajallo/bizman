import { TopBar } from "@/components/layout/top-bar";

export default function DocsPage() {
  return (
    <div>
      <TopBar title="Docs" subtitle="Internal documentation and knowledge base" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Docs module coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
