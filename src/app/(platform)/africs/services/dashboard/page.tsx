import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Clock,
  HardHat,
  Headset,
  GanttChart,
  ArrowRight,
} from "lucide-react";

const sections = [
  { title: "Timesheets", subtitle: "Billable hours and utilization", icon: Clock, href: "/africs/services/timesheets" },
  { title: "Field Service", subtitle: "On-site work orders and dispatch", icon: HardHat, href: "/africs/services/field-service" },
  { title: "Helpdesk", subtitle: "Support tickets and resolution", icon: Headset, href: "/africs/services/helpdesk" },
  { title: "Planning", subtitle: "Resource allocation and scheduling", icon: GanttChart, href: "/africs/services/planning" },
];

export default function ServicesDashboardPage() {
  return (
    <div>
      <TopBar
        title="Services"
        subtitle="Service delivery and operations overview"
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
