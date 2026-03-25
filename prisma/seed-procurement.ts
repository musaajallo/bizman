import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!tenant) {
    console.error("No owner business found. Run the main seed first.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { tenantUsers: { some: { tenantId: tenant.id } } },
  });
  if (!user) {
    console.error("No user found for this tenant.");
    process.exit(1);
  }

  // Ensure vendor exists (seed-bills may have already created them)
  const vendorNames = [
    "Gambia Telecom Solutions",
    "Atlantic Office Supplies",
    "West Africa Power Systems",
    "TechZone Gambia",
  ];
  const vendorData = [
    { name: "Gambia Telecom Solutions", email: "billing@gts.gm", contactName: "Lamin Jallow", phone: "+220 778 1234", address: "Kairaba Avenue, Bakau", paymentTerms: "net30" },
    { name: "Atlantic Office Supplies", email: "orders@atlanticoffice.gm", contactName: "Fatoumata Ceesay", phone: "+220 990 5678", address: "Serrekunda Market Area", paymentTerms: "net15" },
    { name: "West Africa Power Systems", email: "info@waps.gm", contactName: "Ousman Sarr", phone: "+220 776 9012", address: "Kanifing Industrial Estate", paymentTerms: "due_on_receipt" },
    { name: "TechZone Gambia", email: "sales@techzone.gm", contactName: "Alieu Marong", phone: "+220 774 2345", address: "Banjul, Independence Avenue", paymentTerms: "net30", notes: "IT equipment and accessories supplier" },
  ];

  const vendors: Record<string, string> = {};
  for (const v of vendorData) {
    const existing = await prisma.vendor.findFirst({ where: { tenantId: tenant.id, name: v.name } });
    if (existing) {
      vendors[v.name] = existing.id;
    } else {
      const created = await prisma.vendor.create({ data: { tenantId: tenant.id, ...v, status: "active" } });
      vendors[created.name] = created.id;
      console.log(`  Created vendor: ${created.name}`);
    }
  }

  // Procurement settings
  await prisma.procurementSettings.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id },
    update: {},
  });

  console.log("\nSeeding purchase requisitions...");

  type ReqInput = {
    title: string;
    description?: string;
    department: string;
    priority: string;
    status: string;
    requiredByDate?: Date;
    notes?: string;
    reviewNote?: string;
    createdAt: Date;
    items: { description: string; quantity: number; unit: string; estimatedUnitPrice?: number }[];
  };

  const REQUISITIONS: ReqInput[] = [
    {
      title: "Office Supplies Restock — Q1 2026",
      description: "Routine restock of office consumables",
      department: "Administration",
      priority: "normal",
      status: "approved",
      requiredByDate: new Date("2026-02-15"),
      createdAt: new Date("2026-01-10"),
      items: [
        { description: "A4 Printer Paper (500 sheets/ream)", quantity: 20, unit: "ream", estimatedUnitPrice: 180 },
        { description: "Ballpoint Pens (box of 50)", quantity: 5, unit: "box", estimatedUnitPrice: 120 },
        { description: "Stapler & Staples Set", quantity: 3, unit: "pcs", estimatedUnitPrice: 250 },
        { description: "File Folders (pack of 20)", quantity: 10, unit: "pack", estimatedUnitPrice: 95 },
      ],
    },
    {
      title: "IT Equipment — Developer Workstations",
      description: "Two high-spec laptops for new hires in the development team",
      department: "Technology",
      priority: "high",
      status: "approved",
      requiredByDate: new Date("2026-02-28"),
      createdAt: new Date("2026-01-15"),
      items: [
        { description: "Dell Precision 7680 Laptop (i9, 32GB RAM, 1TB SSD)", quantity: 2, unit: "pcs", estimatedUnitPrice: 85000 },
        { description: "Dell 27\" 4K USB-C Monitor", quantity: 2, unit: "pcs", estimatedUnitPrice: 28000 },
        { description: "Logitech MX Keys Keyboard", quantity: 2, unit: "pcs", estimatedUnitPrice: 4500 },
        { description: "Logitech MX Master 3 Mouse", quantity: 2, unit: "pcs", estimatedUnitPrice: 3200 },
      ],
    },
    {
      title: "Generator Fuel — March 2026",
      description: "Monthly diesel fuel for backup generator",
      department: "Operations",
      priority: "urgent",
      status: "converted",
      requiredByDate: new Date("2026-03-05"),
      notes: "Must be procured before end of month to avoid power outage risk",
      createdAt: new Date("2026-02-25"),
      items: [
        { description: "Diesel Fuel (200L)", quantity: 200, unit: "litre", estimatedUnitPrice: 92 },
      ],
    },
    {
      title: "Cleaning Supplies — Q1 2026",
      department: "Facilities",
      priority: "low",
      status: "pending_approval",
      createdAt: new Date("2026-03-01"),
      items: [
        { description: "Floor Cleaner (5L bottle)", quantity: 6, unit: "pcs", estimatedUnitPrice: 220 },
        { description: "Disinfectant Spray", quantity: 12, unit: "pcs", estimatedUnitPrice: 85 },
        { description: "Mop & Bucket Set", quantity: 2, unit: "pcs", estimatedUnitPrice: 450 },
        { description: "Bin Liners (roll of 50)", quantity: 4, unit: "roll", estimatedUnitPrice: 75 },
      ],
    },
    {
      title: "Conference Room AV Equipment",
      description: "Upgrade conference room with better display and audio equipment",
      department: "Administration",
      priority: "normal",
      status: "draft",
      requiredByDate: new Date("2026-04-30"),
      createdAt: new Date("2026-03-10"),
      items: [
        { description: "65\" Smart TV / Display", quantity: 1, unit: "pcs", estimatedUnitPrice: 42000 },
        { description: "HDMI Matrix Switch 4x1", quantity: 1, unit: "pcs", estimatedUnitPrice: 8500 },
        { description: "Wireless Presentation System", quantity: 1, unit: "pcs", estimatedUnitPrice: 12000 },
        { description: "Ceiling Speakers (pair)", quantity: 2, unit: "pair", estimatedUnitPrice: 5500 },
      ],
    },
  ];

  let reqCounter = 1;
  const createdReqs: Record<string, string> = {};

  for (const r of REQUISITIONS) {
    const requisitionNumber = `REQ-${String(reqCounter).padStart(4, "0")}`;
    const existing = await prisma.purchaseRequisition.findFirst({
      where: { tenantId: tenant.id, title: r.title },
    });
    if (existing) {
      console.log(`  Requisition already exists: ${existing.requisitionNumber} — ${r.title}`);
      createdReqs[r.title] = existing.id;
      reqCounter++;
      continue;
    }

    const req = await prisma.purchaseRequisition.create({
      data: {
        tenantId: tenant.id,
        requisitionNumber,
        title: r.title,
        description: r.description ?? null,
        department: r.department,
        priority: r.priority,
        status: r.status,
        requiredByDate: r.requiredByDate ?? null,
        notes: r.notes ?? null,
        requestedById: user.id,
        reviewedById: ["approved", "rejected", "converted"].includes(r.status) ? user.id : null,
        reviewNote: r.reviewNote ?? null,
        reviewedAt: ["approved", "rejected", "converted"].includes(r.status) ? new Date() : null,
        createdAt: r.createdAt,
        items: {
          create: r.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            estimatedUnitPrice: item.estimatedUnitPrice ?? null,
            estimatedTotal: item.estimatedUnitPrice ? item.quantity * item.estimatedUnitPrice : null,
            order: idx,
          })),
        },
      },
    });

    createdReqs[r.title] = req.id;
    console.log(`  Created requisition: ${requisitionNumber} — ${r.title} (${r.status})`);
    reqCounter++;
  }

  // Update settings counter
  await prisma.procurementSettings.update({
    where: { tenantId: tenant.id },
    data: { nextRequisitionNumber: reqCounter },
  });

  console.log("\nSeeding purchase orders...");

  type PoInput = {
    title: string;
    description?: string;
    vendorName: string;
    requisitionTitle?: string;
    currency: string;
    taxRate: number;
    status: string;
    issueDate: Date;
    expectedDelivery?: Date;
    receivedDate?: Date;
    notes?: string;
    items: { description: string; quantity: number; unit: string; unitPrice: number }[];
  };

  const PURCHASE_ORDERS: PoInput[] = [
    {
      title: "Office Supplies — Q1 2026",
      vendorName: "Atlantic Office Supplies",
      requisitionTitle: "Office Supplies Restock — Q1 2026",
      currency: "GMD",
      taxRate: 0,
      status: "received",
      issueDate: new Date("2026-01-20"),
      expectedDelivery: new Date("2026-02-10"),
      receivedDate: new Date("2026-02-08"),
      items: [
        { description: "A4 Printer Paper (500 sheets/ream)", quantity: 20, unit: "ream", unitPrice: 175 },
        { description: "Ballpoint Pens (box of 50)", quantity: 5, unit: "box", unitPrice: 115 },
        { description: "Stapler & Staples Set", quantity: 3, unit: "pcs", unitPrice: 240 },
        { description: "File Folders (pack of 20)", quantity: 10, unit: "pack", unitPrice: 90 },
      ],
    },
    {
      title: "Developer Workstations — Feb 2026",
      vendorName: "TechZone Gambia",
      requisitionTitle: "IT Equipment — Developer Workstations",
      currency: "GMD",
      taxRate: 15,
      status: "partially_received",
      issueDate: new Date("2026-02-01"),
      expectedDelivery: new Date("2026-02-25"),
      notes: "Deliver laptops first, monitors to follow",
      items: [
        { description: "Dell Precision 7680 Laptop (i9, 32GB RAM, 1TB SSD)", quantity: 2, unit: "pcs", unitPrice: 82000 },
        { description: "Dell 27\" 4K USB-C Monitor", quantity: 2, unit: "pcs", unitPrice: 27500 },
        { description: "Logitech MX Keys Keyboard", quantity: 2, unit: "pcs", unitPrice: 4400 },
        { description: "Logitech MX Master 3 Mouse", quantity: 2, unit: "pcs", unitPrice: 3100 },
      ],
    },
    {
      title: "Diesel Fuel — March 2026",
      vendorName: "West Africa Power Systems",
      requisitionTitle: "Generator Fuel — March 2026",
      currency: "GMD",
      taxRate: 0,
      status: "sent",
      issueDate: new Date("2026-03-01"),
      expectedDelivery: new Date("2026-03-05"),
      items: [
        { description: "Diesel Fuel (200L)", quantity: 200, unit: "litre", unitPrice: 90 },
      ],
    },
    {
      title: "Internet & Telephony Services — Q1 2026",
      vendorName: "Gambia Telecom Solutions",
      currency: "GMD",
      taxRate: 15,
      status: "billed",
      issueDate: new Date("2026-01-10"),
      expectedDelivery: new Date("2026-01-10"),
      receivedDate: new Date("2026-01-10"),
      notes: "Quarterly service agreement renewal",
      items: [
        { description: "Business Broadband (100Mbps) — 3 months", quantity: 3, unit: "month", unitPrice: 6500 },
        { description: "Business Phone Lines (x5) — 3 months", quantity: 3, unit: "month", unitPrice: 2000 },
      ],
    },
    {
      title: "Spare Laptops for Staff Pool",
      vendorName: "TechZone Gambia",
      currency: "GMD",
      taxRate: 15,
      status: "draft",
      issueDate: new Date("2026-03-15"),
      items: [
        { description: "Lenovo ThinkPad E15 (i5, 16GB RAM, 512GB SSD)", quantity: 3, unit: "pcs", unitPrice: 48000 },
        { description: "Laptop Bag 15.6\"", quantity: 3, unit: "pcs", unitPrice: 1200 },
      ],
    },
  ];

  let poCounter = 1;
  for (const po of PURCHASE_ORDERS) {
    const poNumber = `PO-${String(poCounter).padStart(4, "0")}`;
    const vendorId = vendors[po.vendorName];
    if (!vendorId) {
      console.warn(`  Vendor not found: ${po.vendorName}, skipping PO`);
      poCounter++;
      continue;
    }

    const existing = await prisma.purchaseOrder.findFirst({
      where: { tenantId: tenant.id, title: po.title },
    });
    if (existing) {
      console.log(`  PO already exists: ${existing.poNumber} — ${po.title}`);
      poCounter++;
      continue;
    }

    const requisitionId = po.requisitionTitle ? (createdReqs[po.requisitionTitle] ?? null) : null;

    const subtotal = po.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = parseFloat(((po.taxRate / 100) * subtotal).toFixed(2));
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    await prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        poNumber,
        title: po.title,
        description: po.description ?? null,
        vendorId,
        requisitionId,
        currency: po.currency,
        taxRate: po.taxRate,
        subtotal,
        taxAmount,
        totalAmount,
        status: po.status,
        issueDate: po.issueDate,
        expectedDelivery: po.expectedDelivery ?? null,
        receivedDate: po.receivedDate ?? null,
        notes: po.notes ?? null,
        createdById: user.id,
        items: {
          create: po.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            quantityReceived: po.status === "received" ? item.quantity : po.status === "partially_received" ? Math.floor(item.quantity / 2) : 0,
            order: idx,
          })),
        },
      },
    });

    // If requisition was used, mark it as converted
    if (requisitionId && po.status !== "draft") {
      await prisma.purchaseRequisition.update({
        where: { id: requisitionId },
        data: { status: "converted" },
      }).catch(() => {}); // ignore if already updated
    }

    console.log(`  Created PO: ${poNumber} — ${po.title} (${po.status})`);
    poCounter++;
  }

  // Update PO counter
  await prisma.procurementSettings.update({
    where: { tenantId: tenant.id },
    data: { nextPoNumber: poCounter },
  });

  console.log(`\nDone! ${reqCounter - 1} requisitions, ${poCounter - 1} purchase orders seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
