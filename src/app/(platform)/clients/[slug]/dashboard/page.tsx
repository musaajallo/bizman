import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, FileOutput } from "lucide-react";
import { getTenantBySlug, getTenantStats } from "@/lib/actions/tenants";
import { notFound } from "next/navigation";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const stats = await getTenantStats(tenant.id);

  const statCards = [
    { label: "Staff Profiles", value: stats.profileCount, icon: Users },
    { label: "Forms", value: stats.formCount, icon: FileText },
    { label: "Users", value: stats.userCount, icon: FileOutput },
  ];

  return (
    <div>
      <TopBar title="Client Dashboard" subtitle={tenant.name} />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent submissions yet. Create a form to start collecting data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
