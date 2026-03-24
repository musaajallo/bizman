import { getLeaveSettings, getLeaveSettingsHistory } from "@/lib/actions/leave-settings";
import { LeaveSettingsForm } from "@/components/leave/leave-settings-form";
import { Separator } from "@/components/ui/separator";

export default async function LeaveSettingsPage() {
  const [settings, history] = await Promise.all([
    getLeaveSettings(),
    getLeaveSettingsHistory(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Leave Policy</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure default entitlements for each leave type. These values are used when
          bulk-allocating leave balances and shown to reviewers when processing requests.
        </p>
        <LeaveSettingsForm settings={settings} />
      </div>

      {history.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-1">Change History</h3>
            <p className="text-xs text-muted-foreground mb-4">
              All policy changes are recorded with the user who made them.
            </p>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Changed by</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Maternity</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">+Annual</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Paternity</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">+Annual</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sick/mo</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Annual</th>
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
                      <td className="px-3 py-2 text-right font-mono">{entry.maternityLeaveDays}d</td>
                      <td className="px-3 py-2 text-center">{entry.maternityCanCombineWithAnnual ? "✓" : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.paternityLeaveDays}d</td>
                      <td className="px-3 py-2 text-center">{entry.paternityCanCombineWithAnnual ? "✓" : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.sickLeaveAccrualPerMonth}d</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.annualLeaveDefaultDays}d</td>
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
