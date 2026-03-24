import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const VENDORS = [
  {
    name: "Gambia Telecom Solutions",
    contactName: "Lamin Jallow",
    email: "billing@gts.gm",
    phone: "+220 778 1234",
    address: "Kairaba Avenue, Bakau",
    paymentTerms: "net30",
    notes: "Primary telecom and internet provider",
  },
  {
    name: "Atlantic Office Supplies",
    contactName: "Fatoumata Ceesay",
    email: "orders@atlanticoffice.gm",
    phone: "+220 990 5678",
    address: "Serrekunda Market Area",
    paymentTerms: "net15",
  },
  {
    name: "West Africa Power Systems",
    contactName: "Ousman Sarr",
    email: "info@waps.gm",
    phone: "+220 776 9012",
    address: "Kanifing Industrial Estate",
    paymentTerms: "due_on_receipt",
  },
  {
    name: "Baobab Cleaning Services",
    contactName: "Isatou Baldeh",
    email: "baobabclean@gmail.com",
    phone: "+220 998 3456",
    address: "Pipeline, Banjul",
    paymentTerms: "net15",
  },
  {
    name: "Pan African Consulting Ltd",
    contactName: "Dr. Amadou Diallo",
    email: "accounts@pafc.africa",
    phone: "+220 773 7890",
    address: "Independence Drive, Banjul",
    paymentTerms: "net60",
    notes: "Legal and compliance consulting",
  },
];

type BillInput = {
  vendorIdx: number;
  title: string;
  subtotal: number;
  taxRate?: number;
  currency?: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  description?: string;
  notes?: string;
  amountPaid?: number;
  paidAt?: Date;
};

const BILLS: BillInput[] = [
  // Telecom — monthly recurring
  {
    vendorIdx: 0,
    title: "Internet & Phone — January 2026",
    subtotal: 8500,
    taxRate: 15,
    issueDate: new Date("2026-01-05"),
    dueDate: new Date("2026-02-04"),
    status: "paid",
    amountPaid: 9775,
    paidAt: new Date("2026-01-28"),
  },
  {
    vendorIdx: 0,
    title: "Internet & Phone — February 2026",
    subtotal: 8500,
    taxRate: 15,
    issueDate: new Date("2026-02-05"),
    dueDate: new Date("2026-03-07"),
    status: "paid",
    amountPaid: 9775,
    paidAt: new Date("2026-02-26"),
  },
  {
    vendorIdx: 0,
    title: "Internet & Phone — March 2026",
    subtotal: 8500,
    taxRate: 15,
    issueDate: new Date("2026-03-05"),
    dueDate: new Date("2026-04-04"),
    status: "approved",
  },

  // Office supplies
  {
    vendorIdx: 1,
    title: "Q4 2025 Office Supplies",
    subtotal: 12400,
    issueDate: new Date("2025-12-20"),
    dueDate: new Date("2026-01-04"),
    status: "paid",
    amountPaid: 12400,
    paidAt: new Date("2025-12-31"),
    description: "Stationery, printer cartridges, and desk accessories",
  },
  {
    vendorIdx: 1,
    title: "Q1 2026 Office Supplies",
    subtotal: 9800,
    issueDate: new Date("2026-03-15"),
    dueDate: new Date("2026-03-30"),
    status: "draft",
    description: "Stationery, A4 paper, and filing supplies",
  },

  // Power / utilities — overdue
  {
    vendorIdx: 2,
    title: "Generator Maintenance — December 2025",
    subtotal: 35000,
    issueDate: new Date("2025-12-10"),
    dueDate: new Date("2026-01-10"),
    status: "paid",
    amountPaid: 35000,
    paidAt: new Date("2026-01-08"),
  },
  {
    vendorIdx: 2,
    title: "Generator Fuel — January 2026",
    subtotal: 18500,
    issueDate: new Date("2026-01-31"),
    dueDate: new Date("2026-02-07"),
    status: "overdue",
    description: "Monthly fuel supply for backup generator",
  },

  // Cleaning — partial payment
  {
    vendorIdx: 3,
    title: "Cleaning Services — Q1 2026",
    subtotal: 24000,
    issueDate: new Date("2026-01-01"),
    dueDate: new Date("2026-01-15"),
    status: "partially_paid",
    amountPaid: 12000,
    description: "January–March 2026 cleaning contract",
  },

  // Consulting — USD
  {
    vendorIdx: 4,
    title: "Legal Compliance Review — FY2025",
    subtotal: 4500,
    taxRate: 0,
    currency: "USD",
    issueDate: new Date("2026-01-15"),
    dueDate: new Date("2026-03-15"),
    status: "approved",
    description: "Annual legal and regulatory compliance audit",
    notes: "Includes GDPR review and employment law update",
  },
];

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!tenant) {
    console.error("No owner business found. Run the main seed first.");
    process.exit(1);
  }

  console.log("Seeding vendors and bills...");

  // Create vendors
  const createdVendors = [];
  for (const v of VENDORS) {
    const existing = await prisma.vendor.findFirst({ where: { tenantId: tenant.id, name: v.name } });
    if (existing) {
      console.log(`  Vendor already exists: ${v.name}`);
      createdVendors.push(existing);
    } else {
      const vendor = await prisma.vendor.create({
        data: { tenantId: tenant.id, ...v, status: "active" },
      });
      console.log(`  Created vendor: ${vendor.name}`);
      createdVendors.push(vendor);
    }
  }

  // Get/create bill settings
  await prisma.billSettings.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, billPrefix: "BILL", nextBillNumber: 1 },
    update: {},
  });

  // Create bills
  let billCounter = 1;
  for (const b of BILLS) {
    const vendor = createdVendors[b.vendorIdx];
    const billNumber = `BILL-${String(billCounter).padStart(4, "0")}`;
    billCounter++;

    const taxRate = b.taxRate ?? 0;
    const taxAmount = parseFloat(((taxRate / 100) * b.subtotal).toFixed(2));
    const totalAmount = parseFloat((b.subtotal + taxAmount).toFixed(2));
    const amountPaid = b.amountPaid ?? 0;
    const amountDue = parseFloat((totalAmount - amountPaid).toFixed(2));
    const currency = b.currency ?? "GMD";

    const existing = await prisma.bill.findFirst({
      where: { tenantId: tenant.id, title: b.title, vendorId: vendor.id },
    });

    if (existing) {
      console.log(`  Bill already exists: ${billNumber} — ${b.title}`);
      billCounter--; // don't increment for skipped
      continue;
    }

    const bill = await prisma.bill.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendor.id,
        billNumber,
        title: b.title,
        subtotal: b.subtotal,
        taxRate: b.taxRate ?? null,
        taxAmount,
        totalAmount,
        amountPaid,
        amountDue,
        currency,
        issueDate: b.issueDate,
        dueDate: b.dueDate,
        status: b.status,
        description: b.description ?? null,
        notes: b.notes ?? null,
        paidAt: b.paidAt ?? null,
      },
    });

    // Create payment record for paid/partially_paid bills
    if (amountPaid > 0 && b.paidAt) {
      await prisma.billPayment.create({
        data: {
          billId: bill.id,
          tenantId: tenant.id,
          amount: amountPaid,
          paymentDate: b.paidAt,
          paymentMethod: "bank_transfer",
          reference: `REF-${billNumber}`,
        },
      });
    } else if (amountPaid > 0) {
      await prisma.billPayment.create({
        data: {
          billId: bill.id,
          tenantId: tenant.id,
          amount: amountPaid,
          paymentDate: new Date(),
          paymentMethod: "bank_transfer",
        },
      });
    }

    console.log(`  Created bill: ${billNumber} — ${b.title} (${b.status})`);
  }

  // Update bill settings counter to match what was created
  await prisma.billSettings.update({
    where: { tenantId: tenant.id },
    data: { nextBillNumber: billCounter },
  });

  console.log(`\nDone! ${billCounter - 1} bills seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
