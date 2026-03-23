import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Calculator, Users, Package, AlertTriangle, DollarSign } from "lucide-react";

export default function MyBusinessPage() {
  return (
    <div>
      <TopBar title="Africs" subtitle="Business Dashboard" />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Open Projects", value: "5", icon: FolderKanban, color: "text-blue-400" },
            { label: "Unpaid Invoices", value: "3", icon: DollarSign, color: "text-amber-400" },
            { label: "Staff Count", value: "8", icon: Users, color: "text-emerald-400" },
            { label: "Low Stock Alerts", value: "2", icon: AlertTriangle, color: "text-red-400" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "New Project", icon: FolderKanban, href: "/africs/projects" },
            { label: "Record Transaction", icon: Calculator, href: "/africs/accounting" },
            { label: "Add Staff", icon: Users, href: "/africs/hr" },
            { label: "Check Inventory", icon: Package, href: "/africs/inventory" },
          ].map((action) => (
            <Card key={action.label} className="cursor-pointer transition-colors hover:border-primary/50">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
