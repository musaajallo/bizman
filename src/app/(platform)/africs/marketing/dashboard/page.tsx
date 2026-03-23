import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Share2,
  Mail,
  MessageSquare,
  CalendarDays,
  Zap,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

const sections = [
  { title: "Social Marketing", subtitle: "Social media campaigns and analytics", icon: Share2, href: "/africs/marketing/social" },
  { title: "Email Marketing", subtitle: "Email campaigns and deliverability", icon: Mail, href: "/africs/marketing/email" },
  { title: "SMS Marketing", subtitle: "SMS campaigns and reach", icon: MessageSquare, href: "/africs/marketing/sms" },
  { title: "Events", subtitle: "Event planning and attendance", icon: CalendarDays, href: "/africs/marketing/events" },
  { title: "Marketing Automation", subtitle: "Workflows and triggers", icon: Zap, href: "/africs/marketing/automation" },
  { title: "Surveys", subtitle: "Feedback collection and insights", icon: ClipboardList, href: "/africs/marketing/surveys" },
];

export default function MarketingDashboardPage() {
  return (
    <div>
      <TopBar
        title="Marketing"
        subtitle="Marketing overview across all channels"
      />
      <div className="p-6 space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{s.title}</h2>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>
              <Link href={s.href}>
                <Button size="sm" variant="outline" className="gap-2 text-xs">
                  View {s.title}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {s.title} dashboard coming soon.
                </p>
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
