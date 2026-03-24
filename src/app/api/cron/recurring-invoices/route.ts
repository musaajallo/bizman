import {
  processAllTenantsRecurringInvoices,
  checkAllTenantsOverdueInvoices,
  sendAllOverdueReminders,
} from "@/lib/actions/invoices";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const start = Date.now();
  try {
    const [overdueResult, recurringResult, reminderResult] = await Promise.all([
      checkAllTenantsOverdueInvoices(),
      processAllTenantsRecurringInvoices(),
      sendAllOverdueReminders(),
    ]);

    const result = {
      ...recurringResult,
      overdueMarked: overdueResult.marked,
      remindersSent: reminderResult.sent,
      remindersTotal: reminderResult.total,
    };
    console.log("[cron/daily-invoices] completed", { ...result, durationMs: Date.now() - start });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/daily-invoices] failed", { error: String(err), durationMs: Date.now() - start });
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
