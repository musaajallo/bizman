import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function FormsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div>
      <TopBar title="Forms" subtitle="HR forms and documents" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Forms</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              HR forms and document management for this client are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
