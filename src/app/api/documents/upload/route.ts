import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const mimeType = file.type || "application/octet-stream";

  const url = await uploadFile(key, buffer, mimeType);

  return NextResponse.json({
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  });
}
