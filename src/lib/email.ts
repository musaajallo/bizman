// Email utility — swap the sendEmail implementation when Resend is set up.
// For now, logs to console. Replace with Resend client when ready.

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | Uint8Array }[];
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  // TODO: Replace with Resend when ready
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const { error } = await resend.emails.send({
  //   from: payload.from ?? process.env.EMAIL_FROM ?? 'AfricsCore <noreply@africscore.com>',
  //   to: payload.to,
  //   subject: payload.subject,
  //   html: payload.html,
  //   replyTo: payload.replyTo,
  //   attachments: payload.attachments?.map(a => ({
  //     filename: a.filename,
  //     content: a.content,
  //   })),
  // });
  // if (error) return { success: false, error: error.message };
  // return { success: true };

  console.log("=== EMAIL SEND (stub) ===");
  console.log("To:", payload.to);
  console.log("Subject:", payload.subject);
  console.log("Attachments:", payload.attachments?.map(a => a.filename).join(", ") || "none");
  console.log("HTML length:", payload.html.length);
  console.log("=========================");

  return { success: true };
}
