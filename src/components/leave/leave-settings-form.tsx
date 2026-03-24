"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { updateLeaveSettings } from "@/lib/actions/leave-settings";
import type { LeaveSettingsValues } from "@/lib/leave-settings-defaults";

export function LeaveSettingsForm({ settings }: { settings: LeaveSettingsValues }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maternityWithAnnual, setMaternityWithAnnual] = useState(settings.maternityCanCombineWithAnnual);
  const [paternityWithAnnual, setPaternityWithAnnual] = useState(settings.paternityCanCombineWithAnnual);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    // Switches aren't included in FormData when unchecked — set explicitly
    formData.set("maternityCanCombineWithAnnual", String(maternityWithAnnual));
    formData.set("paternityCanCombineWithAnnual", String(paternityWithAnnual));
    startTransition(async () => {
      const result = await updateLeaveSettings(formData);
      if ("error" in result) { setError(result.error ?? "Error"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  const sickAnnual = (settings.sickLeaveAccrualPerMonth * 12).toFixed(1);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Maternity */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Maternity Leave</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Leave entitlement for employees giving birth.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="maternityLeaveDays" className="text-sm">Entitlement (calendar days)</Label>
            <Input
              id="maternityLeaveDays"
              name="maternityLeaveDays"
              type="number"
              min="1"
              defaultValue={settings.maternityLeaveDays}
              className="max-w-36"
              required
            />
            <p className="text-xs text-muted-foreground">Default: 180 days (≈ 6 months)</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Can be combined with annual leave</Label>
            <div className="flex items-center gap-3 h-9">
              <Switch
                id="maternityWithAnnual"
                checked={maternityWithAnnual}
                onCheckedChange={setMaternityWithAnnual}
              />
              <span className="text-sm text-muted-foreground">
                {maternityWithAnnual ? "Allowed" : "Not allowed"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Paternity */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Paternity Leave</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Leave entitlement for employees whose partner has given birth.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="paternityLeaveDays" className="text-sm">Entitlement (days)</Label>
            <Input
              id="paternityLeaveDays"
              name="paternityLeaveDays"
              type="number"
              min="1"
              defaultValue={settings.paternityLeaveDays}
              className="max-w-36"
              required
            />
            <p className="text-xs text-muted-foreground">Default: 10 days</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Can be combined with annual leave</Label>
            <div className="flex items-center gap-3 h-9">
              <Switch
                id="paternityWithAnnual"
                checked={paternityWithAnnual}
                onCheckedChange={setPaternityWithAnnual}
              />
              <span className="text-sm text-muted-foreground">
                {paternityWithAnnual ? "Allowed" : "Not allowed"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sick leave */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Sick Leave</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Accrual-based entitlement earned each month of service.</p>
        </div>
        <div className="space-y-1.5 max-w-sm">
          <Label htmlFor="sickLeaveAccrualPerMonth" className="text-sm">Days accrued per month</Label>
          <Input
            id="sickLeaveAccrualPerMonth"
            name="sickLeaveAccrualPerMonth"
            type="number"
            min="0"
            max="31"
            step="0.25"
            defaultValue={settings.sickLeaveAccrualPerMonth}
            className="max-w-36"
            required
          />
          <p className="text-xs text-muted-foreground">
            Default: 1.5 days/month = {sickAnnual} days/year
          </p>
        </div>
      </section>

      {/* Annual leave */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Annual Leave</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Default allocation used by &ldquo;Bulk Allocate&rdquo; when no override is specified.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="annualLeaveDefaultDays" className="text-sm">Default days per year</Label>
          <Input
            id="annualLeaveDefaultDays"
            name="annualLeaveDefaultDays"
            type="number"
            min="1"
            defaultValue={settings.annualLeaveDefaultDays}
            className="max-w-36"
            required
          />
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-1 border-t">
        <Button type="submit" size="sm" className="gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
        {success && (
          <span className="text-sm text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />Saved
          </span>
        )}
      </div>
    </form>
  );
}
