import { NextResponse } from "next/server";
import { getTenants, getOwnerBusiness } from "@/lib/actions/tenants";

export async function GET() {
  const [tenants, ownerBusiness] = await Promise.all([
    getTenants(),
    getOwnerBusiness(),
  ]);

  const workspaces = tenants.map((t) => ({
    slug: t.isOwnerBusiness ? "africs" : t.slug,
    name: t.name,
    initials: t.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    isOwner: t.isOwnerBusiness,
  }));

  // Ensure owner business is first
  workspaces.sort((a, b) => (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0));

  return NextResponse.json(workspaces);
}
