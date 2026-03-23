"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2, CheckCircle2, Building2, FileText, Upload, X, ImageIcon } from "lucide-react";
import { updateTenant } from "@/lib/actions/tenants";
import { cn } from "@/lib/utils";

interface TenantBranding {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  headerLayout: string | null;
  footerText: string | null;
  pdfWatermark: string | null;
}

interface Props {
  tenant: TenantBranding;
}

const DEFAULT_PRIMARY = "#4F6EF7";
const DEFAULT_ACCENT = "#7CEFCF";

const FONTS = [
  { value: "dm-sans", label: "DM Sans (default)" },
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "open-sans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
  { value: "poppins", label: "Poppins" },
];

const LAYOUTS = [
  { value: "left", label: "Left-aligned" },
  { value: "center", label: "Centered" },
  { value: "right", label: "Right-aligned" },
];

function ColorPicker({
  name,
  label,
  description,
  value,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3 mt-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded cursor-pointer border border-input bg-transparent p-1 shrink-0"
        />
        <Input
          name={name}
          value={value}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          className="h-9 w-28 font-mono text-xs"
          placeholder="#000000"
          maxLength={7}
        />
        <div
          className="h-9 w-9 rounded-lg border border-input shrink-0"
          style={{ backgroundColor: value }}
        />
      </div>
      {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function LivePreview({
  name,
  logoUrl,
  primaryColor,
  accentColor,
  headerLayout,
}: {
  name: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  headerLayout: string;
}) {
  const align =
    headerLayout === "center"
      ? "items-center text-center"
      : headerLayout === "right"
      ? "items-end text-right"
      : "items-start text-left";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-border/40 text-gray-900 select-none">
      {/* Document header */}
      <div
        className="px-6 py-4 flex flex-col gap-1"
        style={{ borderBottom: `3px solid ${primaryColor}` }}
      >
        <div className={cn("flex gap-3", headerLayout === "center" && "justify-center", headerLayout === "right" && "justify-end")}>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-9 object-contain" />
          )}
          {!logoUrl && (
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: primaryColor }}
            >
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className={cn("flex flex-col justify-center", align)}>
            <p className="text-sm font-bold leading-tight" style={{ color: primaryColor }}>
              {name}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Invoice</p>
          </div>
        </div>
      </div>

      {/* Fake content */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded bg-gray-100" />
            <div className="h-2 w-28 rounded bg-gray-200" />
          </div>
          <div className="text-right space-y-1">
            <div className="h-2 w-16 rounded bg-gray-100 ml-auto" />
            <div className="h-2 w-20 rounded bg-gray-200 ml-auto" />
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-1.5 rounded bg-gray-100" style={{ width: `${45 + i * 8}%` }} />
              <div className="h-1.5 w-12 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <div
            className="h-6 w-24 rounded text-white text-[9px] font-bold flex items-center justify-center"
            style={{ background: accentColor }}
          >
            TOTAL DUE
          </div>
        </div>
      </div>
    </div>
  );
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function LogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!["image/svg+xml", "image/png"].includes(file.type)) {
        setError("Only SVG and PNG files are accepted.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File must be smaller than 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) processFile(files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Logo"
            className="h-12 max-w-[120px] object-contain"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Logo uploaded</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {value.startsWith("data:image/svg") ? "SVG" : "PNG"} · Click Replace to change
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
          )}
        >
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop your logo here, or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">SVG or PNG · max 2 MB</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".svg,.png,image/svg+xml,image/png"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

export function BrandingSettingsForm({ tenant }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor || DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(tenant.accentColor || DEFAULT_ACCENT);
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
  const [headerLayout, setHeaderLayout] = useState(tenant.headerLayout || "left");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    await updateTenant(tenant.id, formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left — settings */}
        <div className="xl:col-span-3 space-y-6">
          {/* Identity & Logo */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Identity & Logo
              </CardTitle>
              <CardDescription className="text-xs">
                Your logo and business name as they appear across the platform and documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* hidden input carries the data URL to the server action */}
              <input type="hidden" name="logoUrl" value={logoUrl} />
              <div>
                <Label className="text-xs mb-1.5 block">Logo</Label>
                <LogoUpload value={logoUrl} onChange={setLogoUrl} />
              </div>
              <div>
                <Label className="text-xs">Business Name</Label>
                <Input
                  value={tenant.name}
                  readOnly
                  className="h-9 mt-1 bg-muted text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Change name in Business Profile settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Colors</CardTitle>
              <CardDescription className="text-xs">
                Brand colors used across documents, PDFs, and UI elements. Document-specific overrides can be set in Invoice Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ColorPicker
                name="primaryColor"
                label="Primary Color"
                description="Main brand color — used for headings, borders, and key UI elements."
                value={primaryColor}
                onChange={setPrimaryColor}
              />
              <ColorPicker
                name="accentColor"
                label="Accent Color"
                description="Secondary color — used for highlights, totals, and action areas."
                value={accentColor}
                onChange={setAccentColor}
              />
              <div className="flex gap-2 pt-1">
                <div className="flex-1 h-8 rounded-lg" style={{ background: primaryColor }} />
                <div className="flex-1 h-8 rounded-lg" style={{ background: accentColor }} />
                <div
                  className="flex-1 h-8 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Layout */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Layout & Typography</CardTitle>
              <CardDescription className="text-xs">
                How your branding is positioned and which typeface is used in documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Header Layout</Label>
                <select
                  name="headerLayout"
                  value={headerLayout}
                  onChange={(e) => setHeaderLayout(e.target.value)}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none mt-1",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  )}
                >
                  {LAYOUTS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Positioning of your logo and business name in document headers.
                </p>
              </div>
              <div>
                <Label className="text-xs">Font Family</Label>
                <select
                  name="fontFamily"
                  defaultValue={tenant.fontFamily || "dm-sans"}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none mt-1",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  )}
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Document Defaults
              </CardTitle>
              <CardDescription className="text-xs">
                Text that appears on all generated PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Footer Text</Label>
                <Textarea
                  name="footerText"
                  defaultValue={tenant.footerText || ""}
                  placeholder="e.g. Confidential — For recipient use only"
                  rows={2}
                  className="text-xs mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Appears at the bottom of every generated PDF.
                </p>
              </div>
              <div>
                <Label className="text-xs">PDF Watermark</Label>
                <Input
                  name="pdfWatermark"
                  defaultValue={tenant.pdfWatermark || ""}
                  placeholder="e.g. DRAFT, CONFIDENTIAL"
                  className="h-9 mt-1 uppercase"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Diagonal watermark text overlaid on all PDF pages.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pb-6">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Branding
            </Button>
            {saved && (
              <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Right — live preview */}
        <div className="xl:col-span-2">
          <div className="sticky top-6 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0.5">
              Live Preview
            </p>
            <LivePreview
              name={tenant.name}
              logoUrl={logoUrl}
              primaryColor={primaryColor}
              accentColor={accentColor}
              headerLayout={headerLayout}
            />
            <p className="text-[10px] text-muted-foreground text-center">
              Approximate document header preview
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
