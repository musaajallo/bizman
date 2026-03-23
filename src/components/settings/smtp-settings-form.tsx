"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { updateSmtpSettings } from "@/lib/actions/smtp-settings";
import { cn } from "@/lib/utils";

interface Settings {
  id: string;
  tenantId: string;
  host: string | null;
  port: number;
  username: string | null;
  password: string | null;
  encryption: string;
  fromName: string | null;
  fromEmail: string | null;
  replyTo: string | null;
  enabled: boolean;
}

interface Props {
  tenantId: string;
  settings: Settings;
}

export function SmtpSettingsForm({ tenantId, settings }: Props) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    formData.set("enabled", String(enabled));
    const res = await updateSmtpSettings(tenantId, formData);
    setSaving(false);
    setResult(res.success ? "success" : "error");
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Enable / disable */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable SMTP</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use your own SMTP server for all outgoing emails.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Server */}
      <Card className={cn(!enabled && "opacity-60 pointer-events-none")}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Server</CardTitle>
          <CardDescription className="text-xs">SMTP host and connection settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label className="text-xs">Host</Label>
              <Input
                name="host"
                defaultValue={settings.host || ""}
                placeholder="smtp.example.com"
                className="h-9 mt-1"
                disabled={!enabled}
              />
            </div>
            <div>
              <Label className="text-xs">Port</Label>
              <Input
                name="port"
                type="number"
                defaultValue={settings.port}
                className="h-9 mt-1"
                disabled={!enabled}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Encryption</Label>
            <select
              name="encryption"
              defaultValue={settings.encryption}
              disabled={!enabled}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none mt-1",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <option value="tls">STARTTLS (587)</option>
              <option value="ssl">SSL/TLS (465)</option>
              <option value="none">None (25)</option>
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">Port auto-suggests based on provider docs — override as needed.</p>
          </div>
        </CardContent>
      </Card>

      {/* Auth */}
      <Card className={cn(!enabled && "opacity-60 pointer-events-none")}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Authentication</CardTitle>
          <CardDescription className="text-xs">Credentials for your SMTP server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Username</Label>
            <Input
              name="username"
              defaultValue={settings.username || ""}
              placeholder="user@example.com"
              className="h-9 mt-1"
              disabled={!enabled}
              autoComplete="off"
            />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <div className="relative mt-1">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                defaultValue={settings.password || ""}
                placeholder={settings.password ? "••••••••••••" : "Enter password or app password"}
                className="h-9 pr-9"
                disabled={!enabled}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              For Gmail, use an App Password — not your account password.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sender */}
      <Card className={cn(!enabled && "opacity-60 pointer-events-none")}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Sender Identity</CardTitle>
          <CardDescription className="text-xs">How recipients see your emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">From Name</Label>
              <Input
                name="fromName"
                defaultValue={settings.fromName || ""}
                placeholder="Africs Inc."
                className="h-9 mt-1"
                disabled={!enabled}
              />
            </div>
            <div>
              <Label className="text-xs">From Email</Label>
              <Input
                name="fromEmail"
                type="email"
                defaultValue={settings.fromEmail || ""}
                placeholder="billing@example.com"
                className="h-9 mt-1"
                disabled={!enabled}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Reply-To <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              name="replyTo"
              type="email"
              defaultValue={settings.replyTo || ""}
              placeholder="hello@example.com"
              className="h-9 mt-1"
              disabled={!enabled}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              If different from the From address — replies go here instead.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" className="gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
        {result === "success" && (
          <span className="text-sm text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        {result === "error" && (
          <span className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed to save
          </span>
        )}
      </div>
    </form>
  );
}
