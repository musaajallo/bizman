import { TopBar } from "@/components/layout/top-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenantBySlug } from "@/lib/actions/tenants";
import { Palette, Puzzle, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const settingsNav = [
  {
    title: "Branding",
    description: "Customize colors, fonts, and layout for this company's portal and PDFs.",
    icon: Palette,
    href: "branding",
  },
  {
    title: "Modules",
    description: "Enable or disable platform modules for this company.",
    icon: Puzzle,
    href: "modules",
  },
  {
    title: "Users",
    description: "View and manage users who have access to this workspace.",
    icon: Users,
    href: "users",
  },
];

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  return (
    <div>
      <TopBar
        title="Company Settings"
        subtitle={tenant.name}
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={`/clients/${slug}/settings/${item.href}`}
            >
              <Card className="transition-colors hover:border-primary/50 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base mt-3">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
