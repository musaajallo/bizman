import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, FileOutput } from "lucide-react";
import { ensureOnboarded } from "@/lib/actions/users";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await ensureOnboarded();
  if (!user) redirect("/sign-in");

  const [tenantCount, userCount, formCount, profileCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.form.count(),
    prisma.profile.count(),
  ]);

  const recentTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { name: true, slug: true, createdAt: true, status: true },
  });

  const stats = [
    { label: "Total Companies", value: tenantCount, icon: Building2 },
    { label: "Total Users", value: userCount, icon: Users },
    { label: "Total Forms", value: formCount, icon: FileText },
    { label: "Staff Profiles", value: profileCount, icon: FileOutput },
  ];

  return (
    <div>
      <TopBar title="Platform Overview" subtitle="Super Admin Dashboard" />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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
            <CardTitle className="text-base">Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No companies yet. Add your first client company to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentTenants.map((tenant) => (
                  <Link
                    key={tenant.slug}
                    href={`/clients/${tenant.slug}/dashboard`}
                    className="flex items-center gap-4 group"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm group-hover:text-primary transition-colors">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {tenant.status}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {tenant.createdAt.toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
