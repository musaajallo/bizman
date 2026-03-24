import { getOvertimeSettings } from "@/lib/actions/overtime-settings";
import { OvertimeSettingsForm } from "@/components/overtime/overtime-settings-form";

export default async function OvertimeSettingsPage() {
  const settings = await getOvertimeSettings();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Overtime Rate Multipliers</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Configure how overtime pay is calculated based on the type of day worked.
      </p>
      <OvertimeSettingsForm settings={settings} />
    </div>
  );
}
