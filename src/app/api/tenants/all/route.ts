import { NextResponse } from "next/server";
import { getTenants } from "@/lib/actions/tenants";

export async function GET() {
  const tenants = await getTenants();

  return NextResponse.json(
    tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isOwnerBusiness: t.isOwnerBusiness,
    }))
  );
}
