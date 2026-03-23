"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSmtpSettings(tenantId: string) {
  const settings = await prisma.smtpSettings.findUnique({
    where: { tenantId },
  });

  return (
    settings ?? {
      id: "",
      tenantId,
      host: null,
      port: 587,
      username: null,
      password: null,
      encryption: "tls",
      fromName: null,
      fromEmail: null,
      replyTo: null,
      enabled: false,
    }
  );
}

export async function updateSmtpSettings(tenantId: string, formData: FormData) {
  const enabled = formData.get("enabled") === "true";
  const port = parseInt(formData.get("port") as string, 10) || 587;

  const data = {
    host: (formData.get("host") as string) || null,
    port,
    username: (formData.get("username") as string) || null,
    password: (formData.get("password") as string) || null,
    encryption: (formData.get("encryption") as string) || "tls",
    fromName: (formData.get("fromName") as string) || null,
    fromEmail: (formData.get("fromEmail") as string) || null,
    replyTo: (formData.get("replyTo") as string) || null,
    enabled,
  };

  await prisma.smtpSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });

  revalidatePath("/africs/settings/integrations/smtp");
  return { success: true };
}
