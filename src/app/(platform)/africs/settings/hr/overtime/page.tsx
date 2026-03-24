import { getOvertimeSettings, getOvertimeSettingsHistory } from "@/lib/actions/overtime-settings";
import { OvertimeSettingsForm } from "@/components/overtime/overtime-settings-form";
import { Separator } from "@/components/ui/separator";

export default async function OvertimeSettingsPage() {
  const [settings, history] = await Promise.all([
    getOvertimeSettings(),
    getOvertimeSettingsHistory(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Overtime Rate Multipliers</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure how overtime pay is calculated. Changes only affect new requests — approved
          overtime is locked in at the rate that was active at the time of approval.
        </p>
        <OvertimeSettingsForm settings={settings} />
      </div>

      {history.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-1">Change History</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Every save is recorded. Approved overtime requests use the rate that was active when they were approved.
            </p>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Changed by</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Standard</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Weekend</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Holiday</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, i) => (
                    <tr key={entry.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2">{entry.changedBy.name ?? entry.changedBy.email}</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.standardRateMultiplier}×</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.weekendRateMultiplier}×</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.holidayRateMultiplier}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
