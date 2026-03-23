import { TopBar } from "@/components/layout/top-bar";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopBar title="Settings" subtitle="Business configuration and preferences" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto flex gap-8">
          <SettingsSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
