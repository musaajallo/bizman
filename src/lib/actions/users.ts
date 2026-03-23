"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenantUsers: {
        include: { tenant: true },
      },
    },
  });
}

export async function ensureOnboarded() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { tenantUsers: { include: { tenant: true } } },
  });

  if (!user) return null;

  // Check if user has any tenants
  if (user.tenantUsers.length === 0) {
    // First user gets super admin + owner business
    const userCount = await prisma.user.count();
    if (userCount === 1) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isSuperAdmin: true },
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: "Africs",
          slug: "africs",
          isOwnerBusiness: true,
          status: "active",
          enabledModules: ["hr", "forms", "pdf"],
        },
      });

      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "company_admin",
        },
      });

      return prisma.user.findUnique({
        where: { id: user.id },
        include: { tenantUsers: { include: { tenant: true } } },
      });
    }
  }

  return user;
}

export async function getTenantUsers(tenantId: string) {
  return prisma.tenantUser.findMany({
    where: { tenantId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}
