import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { getTenants, getTenantStats } from "@/lib/actions/tenants";
import { DeleteCompanyButton } from "@/components/clients/delete-company-button";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default async function ClientsPage() {
  const tenants = await getTenants();

  const tenantsWithStats = await Promise.all(
    tenants
      .filter((t) => !t.isOwnerBusiness)
      .map(async (tenant) => {
        const stats = await getTenantStats(tenant.id);
        return { ...tenant, ...stats };
      })
  );

  return (
    <div>
      <TopBar
        title="Client Companies"
        subtitle="Manage all client workspaces"
        actions={
          <Link href="/clients/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Company
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenantsWithStats.map((company) => {
            const hasData =
              company.formCount > 0 ||
              company.profileCount > 0 ||
              company.projectCount > 0;

            return (
              <div key={company.slug} className="relative group">
                <Link href={`/clients/${company.slug}/dashboard`}>
                  <Card className="transition-colors hover:border-primary/50 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 rounded-lg bg-secondary">
                          <AvatarFallback className="rounded-lg text-xs font-semibold">
                            {company.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">
                              {company.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={
                                statusColors[company.status] ??
                                statusColors.active
                              }
                            >
                              {company.status}
                            </Badge>
                          </div>
                          {company.industry && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {company.industry}
                            </p>
                          )}
                          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{company.userCount} users</span>
                            <span>{company.formCount} forms</span>
                            <span>{company.profileCount} profiles</span>
                            <span>{company.projectCount} projects</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {!hasData && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteCompanyButton
                      tenantId={company.id}
                      name={company.name}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/clients/new">
            <Card className="border-dashed transition-colors hover:border-primary/50 cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[140px]">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Add New Company</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a new client workspace
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
