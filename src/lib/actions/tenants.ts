"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getTenants() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.isSuperAdmin) {
    return prisma.tenant.findMany({ orderBy: { name: "asc" } });
  }

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { userId: session.user.id },
    include: { tenant: true },
  });

  return tenantUsers.map((tu) => tu.tenant);
}

export async function getOwnerBusiness() {
  return prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function createTenant(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string | null;
  const primaryContactEmail = formData.get("primaryContactEmail") as string | null;
  const primaryContactName = formData.get("primaryContactName") as string | null;
  const primaryContactPhone = formData.get("primaryContactPhone") as string | null;
  const isOwnerBusiness = formData.get("isOwnerBusiness") === "true";

  if (!name) return { error: "Company name is required" };

  const slug = slugify(name);

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) return { error: "A company with this name already exists" };

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      industry: industry || undefined,
      primaryContactEmail: primaryContactEmail || undefined,
      primaryContactName: primaryContactName || undefined,
      primaryContactPhone: primaryContactPhone || undefined,
      isOwnerBusiness,
      status: "active",
      enabledModules: ["hr", "forms", "pdf", "projects"],
    },
  });

  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: session.user.id,
      role: "company_admin",
    },
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true, slug: tenant.slug };
}

export async function updateTenant(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const data: Record<string, unknown> = {};
  const fields = [
    "name", "industry", "address", "website",
    "primaryContactName", "primaryContactEmail", "primaryContactPhone",
    "status", "notes", "logoUrl", "primaryColor", "accentColor", "fontFamily",
    "headerLayout", "footerText", "pdfWatermark",
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) data[field] = value || undefined;
  }

  const modules = formData.get("enabledModules");
  if (modules) {
    data.enabledModules = JSON.parse(modules as string);
  }

  await prisma.tenant.update({ where: { id }, data });

  revalidatePath("/clients");
  revalidatePath("/africs/settings/branding");
  return { success: true };
}

export async function archiveTenant(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.tenant.update({
    where: { id },
    data: { status: "archived" },
  });

  revalidatePath("/clients");
  return { success: true };
}

export async function deleteTenant(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return { error: "Company not found" };
  if (tenant.isOwnerBusiness) return { error: "Cannot delete the owner business" };

  // Check for any associated data
  const [formCount, profileCount, projectCount, auditLogCount] = await Promise.all([
    prisma.form.count({ where: { tenantId: id } }),
    prisma.profile.count({ where: { tenantId: id } }),
    prisma.project.count({ where: { clientTenantId: id } }),
    prisma.auditLog.count({ where: { tenantId: id } }),
  ]);

  const total = formCount + profileCount + projectCount + auditLogCount;
  if (total > 0) {
    const parts = [];
    if (formCount > 0) parts.push(`${formCount} form(s)`);
    if (profileCount > 0) parts.push(`${profileCount} profile(s)`);
    if (projectCount > 0) parts.push(`${projectCount} project(s)`);
    if (auditLogCount > 0) parts.push(`${auditLogCount} audit log(s)`);
    return { error: `Cannot delete: company has ${parts.join(", ")}` };
  }

  // Safe to delete — cascade will handle TenantUser, Notification
  await prisma.tenant.delete({ where: { id } });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getTenantStats(tenantId: string) {
  const [formCount, profileCount, userCount, projectCount] = await Promise.all([
    prisma.form.count({ where: { tenantId } }),
    prisma.profile.count({ where: { tenantId } }),
    prisma.tenantUser.count({ where: { tenantId } }),
    prisma.project.count({ where: { clientTenantId: tenantId } }),
  ]);

  return { formCount, profileCount, userCount, projectCount };
}
