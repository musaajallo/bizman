"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import { updateInvoiceSettings } from "@/lib/actions/invoice-settings";

interface Settings {
  id: string;
  tenantId: string;
  prefix: string;
  nextNumber: number;
  defaultDueDays: number;
  defaultNotes: string | null;
  defaultTerms: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankRoutingNumber: string | null;
  bankSwift: string | null;
  bankIban: string | null;
  taxLabel: string | null;
  defaultTaxRate: number | null;
  proformaPrefix: string;
  proformaNextNumber: number;
  accentColor: string | null;
  logoUrl: string | null;
}

interface Props {
  tenantId: string;
  settings: Settings;
}

export function InvoiceSettingsForm({ tenantId, settings }: Props) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accentColor, setAccentColor] = useState(settings.accentColor || "#4F6EF7");

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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Numbering */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Invoice Numbering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Prefix</Label>
              <Input name="prefix" defaultValue={settings.prefix} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Next Number</Label>
              <Input value={settings.nextNumber} readOnly className="h-9 bg-muted" />
              <p className="text-[10px] text-muted-foreground mt-1">Auto-incremented, read-only</p>
            </div>
          </div>
          <div>
            <Label className="text-xs">Default Due Days</Label>
            <Input name="defaultDueDays" type="number" defaultValue={settings.defaultDueDays} className="h-9 w-24" min="1" />
          </div>
        </CardContent>
      </Card>

      {/* Proforma Numbering */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Proforma Numbering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Proforma Prefix</Label>
              <Input name="proformaPrefix" defaultValue={settings.proformaPrefix} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Next Number</Label>
              <Input value={settings.proformaNextNumber} readOnly className="h-9 bg-muted" />
              <p className="text-[10px] text-muted-foreground mt-1">Auto-incremented, read-only</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Tax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Tax Label</Label>
              <Input name="taxLabel" defaultValue={settings.taxLabel || "Tax"} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Default Tax Rate (%)</Label>
              <Input name="defaultTaxRate" type="number" defaultValue={settings.defaultTaxRate ?? ""} className="h-9" min="0" step="0.01" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Bank Name</Label>
              <Input name="bankName" defaultValue={settings.bankName || ""} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Account Name</Label>
              <Input name="bankAccountName" defaultValue={settings.bankAccountName || ""} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Account Number</Label>
              <Input name="bankAccountNumber" defaultValue={settings.bankAccountNumber || ""} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Routing Number</Label>
              <Input name="bankRoutingNumber" defaultValue={settings.bankRoutingNumber || ""} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">SWIFT / BIC</Label>
              <Input name="bankSwift" defaultValue={settings.bankSwift || ""} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">IBAN</Label>
              <Input name="bankIban" defaultValue={settings.bankIban || ""} className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Default Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Default Notes</Label>
            <Textarea name="defaultNotes" defaultValue={settings.defaultNotes || ""} rows={3} className="text-xs" placeholder="Notes to include on every invoice..." />
          </div>
          <div>
            <Label className="text-xs">Default Terms & Conditions</Label>
            <Textarea name="defaultTerms" defaultValue={settings.defaultTerms || ""} rows={3} className="text-xs" placeholder="Payment terms to include on every invoice..." />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Document Branding</CardTitle>
          <CardDescription className="text-xs">Accent color and logo applied consistently across invoices, proformas, receipts, and all generated PDFs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Accent Color</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-input bg-transparent p-1"
              />
              <Input
                name="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-32 font-mono text-xs"
                placeholder="#4F6EF7"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <div
                className="h-9 w-9 rounded border border-input shrink-0"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Used for headers, borders, and accents across all documents.</p>
          </div>
          <div>
            <Label className="text-xs">Logo URL</Label>
            <Input
              name="logoUrl"
              defaultValue={settings.logoUrl || ""}
              className="h-9"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Publicly accessible image URL shown on all documents and PDFs.</p>
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Invoice logo preview" className="mt-2 h-10 object-contain rounded" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" className="gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
        {success && <span className="text-sm text-emerald-400">Settings saved!</span>}
      </div>
    </form>
  );
}
