import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/actions/tenants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}
