import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | Uint8Array }[];
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("sendEmail: RESEND_API_KEY is not set — email skipped");
    return { success: false, error: "Email not configured (RESEND_API_KEY missing)" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = payload.from ?? process.env.EMAIL_FROM ?? "AfricsCore <noreply@africscore.com>";

  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    replyTo: payload.replyTo,
    attachments: payload.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Uint8Array ? Buffer.from(a.content) : a.content,
    })),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
