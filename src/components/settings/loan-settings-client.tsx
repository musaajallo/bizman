"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { saveLoanSettings } from "@/lib/actions/loan-settings";
import { CheckCircle } from "lucide-react";

interface Member {
  userId: string;
  name: string;
  email: string | null;
  role: string;
}

interface Settings {
  requireApproval: boolean;
  approverIds: string[];
}

interface Props {
  settings: Settings | null;
  members: Member[];
}

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export function LoanSettingsClient({ settings, members }: Props) {
  const [isPending, startTransition] = useTransition();
  const [requireApproval, setRequireApproval] = useState(settings?.requireApproval ?? true);
  const [approverIds, setApproverIds] = useState<string[]>(settings?.approverIds ?? []);
  const [saved, setSaved] = useState(false);

  function toggle(userId: string) {
    setApproverIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setSaved(false);
  }

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveLoanSettings(approverIds, requireApproval);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Require approval toggle */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Require approval for loan applications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, all loan applications must be approved before disbursement.
                When disabled, applications are auto-approved on submission.
              </p>
            </div>
            <Switch
              checked={requireApproval}
              onCheckedChange={(v) => { setRequireApproval(v); setSaved(false); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Approvers */}
      {requireApproval && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Loan Approvers</CardTitle>
            <p className="text-xs text-muted-foreground">
              Select one or more team members who can approve or reject loan applications.
              Admins can always approve regardless of this list.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No team members found. Add team members under Settings → Team.
              </p>
            ) : (
              members.map((m) => (
                <label
                  key={m.userId}
                  className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary cursor-pointer"
                >
                  <Checkbox
                    checked={approverIds.includes(m.userId)}
                    onCheckedChange={() => toggle(m.userId)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{m.name}</p>
                    {m.email && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.email}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </Badge>
                </label>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {requireApproval && approverIds.length === 0 && (
        <p className="text-xs text-amber-600">
          No approvers selected — only admins will be able to approve loans.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? "Saving..." : "Save"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
