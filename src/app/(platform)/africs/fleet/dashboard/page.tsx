import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Car,
  IdCard,
  Wrench,
  ClipboardCheck,
  Fuel,
  FileStack,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const sections = [
  { title: "All Vehicles", subtitle: "Fleet inventory and status", icon: Car, href: "/africs/fleet/vehicles" },
  { title: "Drivers", subtitle: "Driver profiles and assignments", icon: IdCard, href: "/africs/fleet/drivers" },
  { title: "Maintenance", subtitle: "Service schedules and repairs", icon: Wrench, href: "/africs/fleet/maintenance" },
  { title: "Inspections", subtitle: "Vehicle inspection records", icon: ClipboardCheck, href: "/africs/fleet/inspections" },
  { title: "Fuel Management", subtitle: "Fuel consumption and costs", icon: Fuel, href: "/africs/fleet/fuel" },
  { title: "Documents", subtitle: "Registration, insurance, and permits", icon: FileStack, href: "/africs/fleet/documents" },
  { title: "Utilization", subtitle: "Vehicle usage and efficiency", icon: BarChart3, href: "/africs/fleet/utilization" },
];

export default function FleetDashboardPage() {
  return (
    <div>
      <TopBar
        title="Fleet Management"
        subtitle="Fleet operations and vehicle overview"
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
