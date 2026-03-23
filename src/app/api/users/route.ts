import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }

  const owner = await prisma.tenant.findFirst({
    where: { isOwnerBusiness: true },
  });
  if (!owner) return NextResponse.json([]);

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: owner.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(tenantUsers.map((tu) => tu.user));
}
