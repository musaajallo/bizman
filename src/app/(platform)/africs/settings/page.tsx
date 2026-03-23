import { getOwnerBusiness } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function BusinessProfileSettingsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Business Profile</h2>
        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your business name, contact details, and company information.
      </p>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Business Name</span>
            <span className="text-sm font-medium">{owner.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Slug</span>
            <span className="text-sm font-mono">{owner.slug}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm">Owner Business</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Full business profile editing will be available in a future update.
        </p>
      </div>
    </div>
  );
}
