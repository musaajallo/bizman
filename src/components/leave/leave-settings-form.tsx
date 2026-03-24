"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { updateLeaveSettings } from "@/lib/actions/leave-settings";
import type { LeaveSettingsValues, AnnualLeaveTier } from "@/lib/leave-settings-defaults";

export function LeaveSettingsForm({ settings }: { settings: LeaveSettingsValues }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maternityWithAnnual, setMaternityWithAnnual] = useState(settings.maternityCanCombineWithAnnual);
  const [paternityWithAnnual, setPaternityWithAnnual] = useState(settings.paternityCanCombineWithAnnual);
  const [tiers, setTiers] = useState<AnnualLeaveTier[]>(
    settings.annualLeaveTiers.length > 0
      ? [...settings.annualLeaveTiers].sort((a, b) => a.minYears - b.minYears)
      : []
  );

  function addTier() {
    const maxMin = tiers.length > 0 ? Math.max(...tiers.map((t) => t.minYears)) : -1;
    setTiers([...tiers, { minYears: maxMin + 1, days: 21 }]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof AnnualLeaveTier, value: number) {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side tier validation
    if (tiers.length > 0) {
      const mins = tiers.map((t) => t.minYears);
      if (new Set(mins).size !== mins.length) {
        setError("Each tier must have a unique minimum years value");
        return;
      }
      if (tiers.some((t) => t.minYears < 0)) {
        setError("Minimum years must be 0 or more");
        return;
      }
      if (tiers.some((t) => t.days < 1)) {
        setError("Days per tier must be at least 1");
        return;
      }
    }

    const formData = new FormData(e.currentTarget);
    formData.set("maternityCanCombineWithAnnual", String(maternityWithAnnual));
    formData.set("paternityCanCombineWithAnnual", String(paternityWithAnnual));
    formData.set("annualLeaveTiers", JSON.stringify(
      [...tiers].sort((a, b) => a.minYears - b.minYears)
    ));

    startTransition(async () => {
      const result = await updateLeaveSettings(formData);
      if ("error" in result) { setError(result.error ?? "Error"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  const sickAnnual = (settings.sickLeaveAccrualPerMonth * 12).toFixed(1);
  const sortedTiers = [...tiers].sort((a, b) => a.minYears - b.minYears);

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
            Fallback allocation used when no service tier applies or no start date is set.
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

        {/* Service-based tiers */}
        <div className="space-y-3 pt-2">
          <div>
            <p className="text-sm font-medium">Service-Based Tiers</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Override the default based on years of service. Employees with no start date use the default above.
            </p>
          </div>

          {sortedTiers.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <p className="text-xs font-medium text-muted-foreground px-1">After X years</p>
                <p className="text-xs font-medium text-muted-foreground px-1">Days entitled</p>
                <span />
              </div>
              {sortedTiers.map((tier, i) => {
                const originalIndex = tiers.indexOf(tier);
                return (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      value={tier.minYears}
                      onChange={(e) => updateTier(originalIndex, "minYears", parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={tier.days}
                      onChange={(e) => updateTier(originalIndex, "days", parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeTier(originalIndex)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addTier}>
            <Plus className="h-3.5 w-3.5" />
            Add Tier
          </Button>

          {sortedTiers.length > 0 && (
            <div className="rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Preview</p>
              {sortedTiers.map((tier, i) => {
                const next = sortedTiers[i + 1];
                const range = next
                  ? `${tier.minYears}–${next.minYears} years`
                  : `${tier.minYears}+ years`;
                return (
                  <p key={i}>{range}: <span className="text-foreground font-medium">{tier.days} days</span></p>
                );
              })}
              <p>No match / no start date: <span className="text-foreground font-medium">{settings.annualLeaveDefaultDays} days</span> (fallback)</p>
            </div>
          )}
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
