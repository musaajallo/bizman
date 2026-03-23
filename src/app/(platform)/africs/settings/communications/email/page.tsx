import Link from "next/link";
import { Mail, Server, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CommunicationsEmailPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-semibold">Email</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Configure how outgoing emails are delivered — for invoices, reminders, receipts, and other notifications.
      </p>

      <div className="max-w-2xl space-y-4">
        {/* Active provider */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Email Provider</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Console (dev)</Badge>
            </div>
            <CardDescription className="text-xs">
              Emails are currently logged to the server console. Connect a provider to start delivering.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Provider options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">Resend</p>
                    <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Transactional email API with analytics, domain verification, and React Email templates.
                  </p>
                  <Link
                    href="/africs/settings/integrations/resend"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
                  >
                    Configure
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Server className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium mb-0.5">SMTP</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Use your own mail server or any SMTP-compatible provider (Gmail, Mailgun, Postmark, SES).
                  </p>
                  <Link
                    href="/africs/settings/integrations/smtp"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
                  >
                    Configure
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What emails are sent */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Emails Sent by AfricsCore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Invoice delivery", desc: "Invoice PDF attached, sent when you click Send" },
              { label: "Payment reminders", desc: "For sent, viewed, or overdue invoices" },
              { label: "Receipt confirmation", desc: "Sent to client when invoice is marked paid" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
