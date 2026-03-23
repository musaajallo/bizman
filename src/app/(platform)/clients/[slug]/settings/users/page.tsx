import { TopBar } from "@/components/layout/top-bar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTenantBySlug } from "@/lib/actions/tenants";
import { getTenantUsers } from "@/lib/actions/users";
import { notFound } from "next/navigation";

const roleLabels: Record<string, string> = {
  company_admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export default async function UsersSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const tenantUsers = await getTenantUsers(tenant.id);

  return (
    <div>
      <TopBar title="Users" subtitle={tenant.name} />

      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Workspace Users ({tenantUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenantUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No users have access to this workspace yet.
              </p>
            ) : (
              <div className="space-y-4">
                {tenantUsers.map((tu) => {
                  const initials = (tu.user.name ?? "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div key={tu.id} className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tu.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {tu.user.email}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {roleLabels[tu.role] ?? tu.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
