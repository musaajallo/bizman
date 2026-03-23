"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { setRecurring, generateNextRecurringInvoice } from "@/lib/actions/invoices";

const INTERVALS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

interface Props {
  invoiceId: string;
  isRecurring: boolean;
  recurringInterval: string | null;
  nextRecurringDate: Date | string | null;
}

export function RecurringInvoiceSettings({ invoiceId, isRecurring, recurringInterval, nextRecurringDate }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(isRecurring);
  const [interval, setInterval] = useState(recurringInterval || "monthly");
  const [nextDate, setNextDate] = useState(
    nextRecurringDate
      ? new Date(nextRecurringDate).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await setRecurring(invoiceId, {
      isRecurring: enabled,
      interval: enabled ? interval : undefined,
      nextDate: enabled ? nextDate : undefined,
    });
    if (result.error) alert(result.error);
    setSaving(false);
    router.refresh();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateNextRecurringInvoice(invoiceId);
    if (result.error) {
      alert(result.error);
      setGenerating(false);
      return;
    }
    setGenerating(false);
    if (result.invoiceId) {
      router.push(`/africs/accounting/invoices/${result.invoiceId}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Recurring Invoice</Label>
          <p className="text-xs text-muted-foreground">
            Automatically create invoices on a schedule
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Interval</Label>
              <Select value={interval} onValueChange={(v: string | null) => { if (v) setInterval(v); }}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Next Invoice Date</Label>
              <Input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Save Schedule
            </Button>
            {isRecurring && (
              <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Generate Now
              </Button>
            )}
          </div>
        </>
      )}

      {!enabled && isRecurring && (
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
          Disable Recurring
        </Button>
      )}
    </div>
  );
}
