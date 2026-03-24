"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteFile } from "@/lib/storage";

// --- Types ---

export interface DocumentWithVersion {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  folder: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  uploadedBy: { id: string; name: string | null; email: string };
  currentVersion: {
    id: string;
    version: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    changelog: string | null;
    createdAt: Date;
  } | null;
}

// --- Queries ---

export async function getDocuments(tenantId: string, folder?: string) {
  const where: Record<string, unknown> = { tenantId, archivedAt: null };
  if (folder) where.folder = folder;

  const docs = await prisma.document.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          id: true,
          version: true,
          fileName: true,
          fileUrl: true,
          fileSize: true,
          mimeType: true,
          changelog: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ folder: "asc" }, { updatedAt: "desc" }],
  });

  return docs.map((d) => ({
    ...d,
    currentVersion: d.versions[0] ?? null,
  })) as DocumentWithVersion[];
}

export async function getDocumentFolders(tenantId: string): Promise<string[]> {
  const docs = await prisma.document.findMany({
    where: { tenantId, archivedAt: null },
    select: { folder: true },
    distinct: ["folder"],
    orderBy: { folder: "asc" },
  });
  return docs.map((d) => d.folder);
}

// --- Mutations ---

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(tenantId: string, base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await prisma.document.findUnique({
      where: { tenantId_slug: { tenantId, slug: candidate } },
    });
    if (!exists) return candidate;
    suffix++;
  }
}

export async function createDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };

  const name = (formData.get("name") as string)?.trim();
  const fileUrl = (formData.get("fileUrl") as string)?.trim();
  const fileName = (formData.get("fileName") as string)?.trim();
  const fileSizeRaw = formData.get("fileSize");
  const mimeType = (formData.get("mimeType") as string)?.trim() || "application/octet-stream";
  const tenantId = (formData.get("tenantId") as string)?.trim();
  const folder = ((formData.get("folder") as string)?.trim() || "/");
  const description = (formData.get("description") as string)?.trim() || null;
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  if (!name || !fileUrl || !fileName || !tenantId) {
    return { error: "Missing required fields" };
  }

  const fileSize = fileSizeRaw ? parseInt(String(fileSizeRaw), 10) : 0;
  const slug = await uniqueSlug(tenantId, name);

  const doc = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        tenantId,
        name,
        slug,
        description,
        folder,
        tags,
        uploadedById: session.user!.id!,
      },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        uploadedById: session.user!.id!,
      },
    });

    await tx.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
    });

    return document;
  });

  revalidatePath("/africs/documents");
  return { success: true, id: doc.id };
}

export async function renameDocument(id: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  await prisma.document.update({
    where: { id },
    data: { name: trimmed, updatedAt: new Date() },
  });

  revalidatePath("/africs/documents");
  return { success: true };
}

export async function archiveDocument(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };

  await prisma.document.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/africs/documents");
  return { success: true };
}

export async function deleteDocument(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };

  // Fetch all version URLs for blob cleanup
  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    select: { fileUrl: true },
  });

  await prisma.document.delete({ where: { id } });

  // Best-effort blob cleanup
  for (const v of versions) {
    try {
      await deleteFile(v.fileUrl);
    } catch {
      // ignore — blob may not exist
    }
  }

  revalidatePath("/africs/documents");
  return { success: true };
}
