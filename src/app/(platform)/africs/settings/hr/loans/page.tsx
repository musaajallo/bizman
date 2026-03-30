import { getLoanSettings, getTeamMembersForApprovers } from "@/lib/actions/loan-settings";
import { LoanSettingsClient } from "@/components/settings/loan-settings-client";

export default async function LoanSettingsPage() {
  const [settings, members] = await Promise.all([
    getLoanSettings(),
    getTeamMembersForApprovers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Loan Approvals</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure who can approve or reject loan applications submitted by staff.
        </p>
      </div>
      <LoanSettingsClient settings={settings} members={members} />
    </div>
  );
}
