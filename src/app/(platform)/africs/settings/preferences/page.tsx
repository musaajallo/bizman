"use client";

import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PreferencesSettingsPage() {
  const sidebarTooltips = usePreferencesStore((s) => s.sidebarTooltips);
  const setSidebarTooltips = usePreferencesStore((s) => s.setSidebarTooltips);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Customize the look and feel of your workspace.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sidebar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sidebar-tooltips" className="text-sm font-medium">
                Menu tooltips
              </Label>
              <p className="text-xs text-muted-foreground">
                Show descriptions when hovering over sidebar menu items.
              </p>
            </div>
            <Switch
              id="sidebar-tooltips"
              checked={sidebarTooltips}
              onCheckedChange={setSidebarTooltips}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
