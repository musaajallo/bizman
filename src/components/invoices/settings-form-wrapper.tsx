"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { updateInvoiceSettings } from "@/lib/actions/invoice-settings";

interface Props {
  tenantId: string;
  children: React.ReactNode;
}

export function SettingsFormWrapper({ tenantId, children }: Props) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    await updateInvoiceSettings(tenantId, formData);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {children}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="sm" className="gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
        {success && (
          <span className="text-sm text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
