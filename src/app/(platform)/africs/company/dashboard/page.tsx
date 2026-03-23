import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Network,
  Building,
  Layers,
  Component,
  Globe,
  MapPin,
  Scale,
  Handshake,
  ArrowRight,
} from "lucide-react";

const sections = [
  { title: "Divisions", subtitle: "Top-level business divisions", icon: Network, href: "/africs/company/divisions" },
  { title: "Departments", subtitle: "Departments within divisions", icon: Building, href: "/africs/company/departments" },
  { title: "Units", subtitle: "Operational units within departments", icon: Layers, href: "/africs/company/units" },
  { title: "Sub-Units", subtitle: "Specialized teams within units", icon: Component, href: "/africs/company/sub-units" },
  { title: "Countries", subtitle: "Countries where you operate", icon: Globe, href: "/africs/company/countries" },
  { title: "Locations", subtitle: "Offices, branches, and work sites", icon: MapPin, href: "/africs/company/locations" },
  { title: "Statutory Registers", subtitle: "Register of directors and shareholders", icon: Scale, href: "/africs/company/statutory-registers" },
];

export default function CompanyDashboardPage() {
  return (
    <div>
      <TopBar
        title="Company"
        subtitle="Organizational structure and company overview"
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
