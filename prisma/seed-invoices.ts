import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const paymentMethods = ["bank_transfer", "cash", "check", "card", "mobile_money"];

// Line item templates per billing type
function buildLineItems(billingType: string, budgetAmount: number | null, hourlyRate: number | null, currency: string) {
  const budget = budgetAmount ?? 5000;
  const rate = hourlyRate ?? 75;

  if (billingType === "hourly") {
    const items = [];
    const phases = randomFrom([
      ["Discovery & Requirements", "Design", "Development"],
      ["Strategy", "Implementation", "Testing & QA"],
      ["Research", "Architecture", "Build", "Deployment"],
    ]);
    for (const phase of phases) {
      const hours = round2(Math.random() * 40 + 10);
      items.push({ description: phase, quantity: hours, unitPrice: rate, unit: "hours" });
    }
    return items;
  }

  if (billingType === "retainer") {
    const monthly = round2(budget / 12);
    const months = Math.floor(Math.random() * 3) + 1;
    return [
      { description: "Monthly Retainer Fee", quantity: months, unitPrice: monthly, unit: "months" },
      ...(Math.random() > 0.5
        ? [{ description: "Additional Hours", quantity: round2(Math.random() * 10 + 2), unitPrice: rate, unit: "hours" }]
        : []),
    ];
  }

  if (billingType === "pro_bono") {
    return [
      { description: "Project Services (Pro Bono)", quantity: 1, unitPrice: 0, unit: "fixed" },
    ];
  }

  // fixed — milestone-based
  const milestones = randomFrom([
    ["Discovery & Planning", "Design & Prototype", "Development", "Testing & Launch"],
    ["Phase 1 — Research", "Phase 2 — Build", "Phase 3 — Review & Handoff"],
    ["Initial Setup", "Core Implementation", "Final Delivery"],
  ]);
  const portions = milestones.map(() => Math.random());
  const total_ = portions.reduce((a, b) => a + b, 0);
  return milestones.map((m, i) => ({
    description: m,
    quantity: 1,
    unitPrice: round2((portions[i] / total_) * budget),
    unit: "fixed",
  }));
}

function calcTotals(items: { quantity: number; unitPrice: number }[], taxRate: number | null) {
  const subtotal = items.reduce((s, i) => s + round2(i.quantity * i.unitPrice), 0);
  const tr = taxRate ?? 0;
  const taxAmount = round2(subtotal * (tr / 100));
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

async function main() {
  console.log("Seeding invoices...");

  const owner = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!owner) throw new Error("No owner business found. Sign up first.");

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found. Sign up first.");

  // Clean up any previously seeded invoices so this script is re-runnable
  const existing = await prisma.invoice.count({ where: { tenantId: owner.id } });
  if (existing > 0) {
    await prisma.invoice.deleteMany({ where: { tenantId: owner.id } });
    console.log(`  Cleared ${existing} existing invoices`);
  }

  // Ensure InvoiceSettings exists
  await prisma.invoiceSettings.upsert({
    where: { tenantId: owner.id },
    update: { nextNumber: 1, proformaNextNumber: 1 },
    create: {
      tenantId: owner.id,
      prefix: "INV",
      nextNumber: 1,
      proformaPrefix: "PRO",
      proformaNextNumber: 1,
      defaultTaxRate: 15,
      defaultDueDays: 30,
      defaultNotes: "Thank you for your business. Payment is due within the specified period.",
      defaultTerms: "Payment is due within 30 days of invoice date. Late payments may incur a 2% monthly fee.",
    },
  });

  // Load and lock counters
  const settings = await prisma.invoiceSettings.findUnique({ where: { tenantId: owner.id } });
  let invCounter = settings!.nextNumber;
  let proCounter = settings!.proformaNextNumber;

  function nextInvNumber(): string {
    const n = String(invCounter).padStart(4, "0");
    invCounter++;
    return `INV-${n}`;
  }

  function nextProNumber(): string {
    const n = String(proCounter).padStart(4, "0");
    proCounter++;
    return `PRO-${n}`;
  }

  // Fetch all projects
  const projects = await prisma.project.findMany({
    where: { tenantId: owner.id },
    include: { clientTenant: true },
  });

  console.log(`  Found ${projects.length} projects to invoice`);

  let invoiceCount = 0;
  let proformaCount = 0;

  for (const project of projects) {
    const currency = project.budgetCurrency ?? "USD";
    const budgetAmount = project.budgetAmount ? Number(project.budgetAmount) : null;
    const hourlyRate = project.hourlyRate ? Number(project.hourlyRate) : null;
    const taxRate = 15; // default

    // Determine client display info
    const clientName =
      project.clientTenant?.name ??
      project.orgName ??
      project.contactName ??
      project.orgContactName ??
      "Client";
    const clientEmail =
      project.clientTenant?.primaryContactEmail ??
      project.contactEmail ??
      project.orgContactEmail ??
      null;

    // Decide which invoices to create based on project status
    const scenarios: Array<{ type: "standard" | "proforma"; status: string }> = [];

    switch (project.status) {
      case "not_started":
        // Mostly proformas awaiting approval
        scenarios.push({ type: "proforma", status: randomFrom(["draft", "sent", "sent", "accepted"]) });
        break;

      case "in_progress":
        // Mix: some have a converted proforma + real invoice, some just an invoice
        if (Math.random() > 0.5) {
          // Proforma already converted to invoice
          scenarios.push({ type: "proforma", status: "converted" });
          scenarios.push({ type: "standard", status: randomFrom(["draft", "sent", "viewed", "sent"]) });
        } else {
          // Direct invoice
          scenarios.push({ type: "standard", status: randomFrom(["draft", "sent", "viewed", "overdue"]) });
        }
        break;

      case "on_hold":
        scenarios.push({ type: "standard", status: randomFrom(["sent", "viewed", "overdue", "draft"]) });
        break;

      case "completed":
        // Mostly paid, some partial
        if (Math.random() > 0.3) {
          scenarios.push({ type: "standard", status: "paid" });
        } else {
          scenarios.push({ type: "standard", status: randomFrom(["sent", "overdue"]) });
        }
        break;

      case "cancelled":
        scenarios.push({ type: "standard", status: randomFrom(["void", "draft"]) });
        break;

      default:
        scenarios.push({ type: "standard", status: "draft" });
    }

    // Track proforma ID for conversion reference
    let convertedProformaId: string | null = null;

    for (const scenario of scenarios) {
      const isProforma = scenario.type === "proforma";
      const invoiceNumber = isProforma ? nextProNumber() : nextInvNumber();
      const status = scenario.status;

      // Build line items
      const rawItems = buildLineItems(project.billingType ?? "fixed", budgetAmount, hourlyRate, currency);
      const { subtotal, taxAmount, total } = calcTotals(rawItems, taxRate);
      const amountPaid = status === "paid" ? total : 0;
      const amountDue = round2(total - amountPaid);

      // Dates
      const issuedDaysAgo = Math.floor(Math.random() * 60 + 5);
      const issueDate = daysAgo(issuedDaysAgo);
      const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sentAt = ["sent", "viewed", "paid", "overdue", "accepted", "converted"].includes(status)
        ? new Date(issueDate.getTime() + 24 * 60 * 60 * 1000)
        : null;
      const viewedAt = ["viewed", "paid", "overdue"].includes(status)
        ? new Date(issueDate.getTime() + 2 * 24 * 60 * 60 * 1000)
        : null;
      const paidDate = status === "paid" ? daysAgo(Math.floor(Math.random() * 20)) : null;
      const voidedAt = status === "void" ? daysAgo(Math.floor(Math.random() * 10)) : null;

      // For converted proformas, link to the next standard invoice we'll create
      const convertedFromId: string | undefined = scenario.type === "standard" && convertedProformaId
        ? convertedProformaId
        : undefined;

      const invoice: Awaited<ReturnType<typeof prisma.invoice.create>> = await prisma.invoice.create({
        data: {
          tenantId: owner.id,
          projectId: project.id,
          clientTenantId: project.clientTenantId ?? undefined,
          invoiceNumber,
          type: scenario.type,
          status,
          issueDate,
          dueDate,
          sentAt,
          viewedAt,
          paidDate,
          voidedAt,
          clientName,
          clientEmail: clientEmail ?? undefined,
          subtotal,
          taxRate,
          taxAmount,
          total,
          amountPaid,
          amountDue,
          currency,
          notes: "Thank you for your business. Payment is due within the specified period.",
          terms: "Payment is due within 30 days of invoice date.",
          convertedFromId,
          createdById: user.id,
        },
      });

      // Track proforma id for conversion link
      if (isProforma && status === "converted") {
        convertedProformaId = invoice.id;
      }

      // Create line items
      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            order: i,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: round2(item.quantity * item.unitPrice),
            unit: item.unit,
          },
        });
      }

      // Create payment for paid invoices
      if (status === "paid" && total > 0) {
        await prisma.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            amount: total,
            method: randomFrom(paymentMethods),
            reference: `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
            date: paidDate!,
            recordedById: user.id,
          },
        });
      }

      // Activity log
      const actionVerbs: Record<string, string> = {
        draft: "created",
        sent: "sent",
        viewed: "viewed",
        paid: "paid",
        overdue: "marked_overdue",
        void: "voided",
        accepted: "accepted",
        converted: "converted",
        expired: "expired",
      };
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: invoice.id,
          actorId: user.id,
          action: actionVerbs[status] ?? "created",
          details: {
            note: isProforma
              ? `Proforma invoice ${invoiceNumber} ${status}`
              : `Invoice ${invoiceNumber} ${status}`,
          },
        },
      });

      if (isProforma) proformaCount++;
      else invoiceCount++;
    }
  }

  // Save updated counters
  await prisma.invoiceSettings.update({
    where: { tenantId: owner.id },
    data: { nextNumber: invCounter, proformaNextNumber: proCounter },
  });

  console.log(`  Created ${invoiceCount} standard invoices`);
  console.log(`  Created ${proformaCount} proforma invoices`);
  console.log("Done! Invoice seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
