"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { updateOvertimeSettings } from "@/lib/actions/overtime-settings";

interface Settings {
  standardRateMultiplier: number;
  weekendRateMultiplier: number;
  holidayRateMultiplier: number;
}

export function OvertimeSettingsForm({ settings }: { settings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOvertimeSettings(formData);
      if ("error" in result) { setError(result.error ?? "Error"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <RateField
          id="standardRateMultiplier"
          label="Standard (Weekday) Rate"
          defaultValue={settings.standardRateMultiplier}
          description="Applied to overtime worked on regular weekdays."
        />
        <RateField
          id="weekendRateMultiplier"
          label="Weekend Rate"
          defaultValue={settings.weekendRateMultiplier}
          description="Applied to overtime worked on Saturdays or Sundays."
        />
        <RateField
          id="holidayRateMultiplier"
          label="Public Holiday Rate"
          defaultValue={settings.holidayRateMultiplier}
          description="Applied to overtime worked on public holidays."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Overtime pay = (Basic salary ÷ 173.33) × multiplier × hours
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
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

function RateField({
  id,
  label,
  defaultValue,
  description,
}: {
  id: string;
  label: string;
  defaultValue: number;
  description: string;
}) {
  return (
    <div className="flex items-start gap-6">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          id={id}
          name={id}
          type="number"
          min="1"
          max="10"
          step="0.1"
          defaultValue={defaultValue}
          className="w-24 text-right font-mono"
          required
        />
        <span className="text-sm text-muted-foreground">×</span>
      </div>
    </div>
  );
}
