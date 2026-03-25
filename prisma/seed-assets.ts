import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type AssetInput = {
  name: string;
  description?: string;
  category: string;
  status: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  location?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currency?: string;
  warrantyExpiry?: Date;
  condition: string;
  depreciationMethod?: string;
  usefulLifeMonths?: number;
  salvageValue?: number;
  notes?: string;
  assignedToName?: string; // first+last to look up employee
};

const ASSETS: AssetInput[] = [
  // === Technology ===
  {
    name: "Dell Precision 7680 — Dev Laptop #1",
    category: "technology",
    status: "active",
    brand: "Dell",
    model: "Precision 7680",
    serialNumber: "DL-7680-001",
    location: "Head Office",
    purchaseDate: new Date("2026-02-08"),
    purchasePrice: 82000,
    currency: "GMD",
    warrantyExpiry: new Date("2029-02-08"),
    condition: "new",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 48,
    salvageValue: 8000,
    description: "Primary development workstation for senior developer",
  },
  {
    name: "Dell Precision 7680 — Dev Laptop #2",
    category: "technology",
    status: "active",
    brand: "Dell",
    model: "Precision 7680",
    serialNumber: "DL-7680-002",
    location: "Head Office",
    purchaseDate: new Date("2026-02-08"),
    purchasePrice: 82000,
    currency: "GMD",
    warrantyExpiry: new Date("2029-02-08"),
    condition: "new",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 48,
    salvageValue: 8000,
  },
  {
    name: "MacBook Pro 14\" M3",
    category: "technology",
    status: "active",
    brand: "Apple",
    model: "MacBook Pro 14 M3",
    serialNumber: "FVFXW12345",
    location: "Head Office",
    purchaseDate: new Date("2025-06-15"),
    purchasePrice: 95000,
    currency: "GMD",
    warrantyExpiry: new Date("2026-06-15"),
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 48,
    salvageValue: 10000,
    description: "Design and product team workstation",
  },
  {
    name: "HP LaserJet Pro M404dn Printer",
    category: "technology",
    status: "active",
    brand: "HP",
    model: "LaserJet Pro M404dn",
    serialNumber: "HP-LJ-2024-001",
    location: "Reception / Print Room",
    purchaseDate: new Date("2024-08-01"),
    purchasePrice: 18500,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 60,
    salvageValue: 500,
  },
  {
    name: "Cisco Meraki MR46 WiFi Access Point",
    category: "technology",
    status: "active",
    brand: "Cisco",
    model: "Meraki MR46",
    serialNumber: "Q2EW-XXXX-0001",
    location: "Server Room",
    purchaseDate: new Date("2024-03-10"),
    purchasePrice: 32000,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 60,
    salvageValue: 2000,
    warrantyExpiry: new Date("2027-03-10"),
  },
  {
    name: "Dell PowerEdge T40 Server",
    category: "technology",
    status: "active",
    brand: "Dell",
    model: "PowerEdge T40",
    serialNumber: "PE-T40-2023-001",
    location: "Server Room",
    purchaseDate: new Date("2023-11-20"),
    purchasePrice: 120000,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 60,
    salvageValue: 15000,
    description: "On-premise file and application server",
  },

  // === Furniture ===
  {
    name: "Executive Office Desk — CEO",
    category: "furniture",
    status: "active",
    brand: "Steelcase",
    location: "CEO Office",
    purchaseDate: new Date("2023-04-01"),
    purchasePrice: 28000,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 120,
    salvageValue: 2000,
  },
  {
    name: "Ergonomic Office Chairs (set of 10)",
    category: "furniture",
    status: "active",
    location: "Open Plan Office",
    purchaseDate: new Date("2023-04-01"),
    purchasePrice: 45000,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 84,
    salvageValue: 4000,
    description: "High-back mesh ergonomic chairs for main office",
  },
  {
    name: "Conference Table (12-person)",
    category: "furniture",
    status: "active",
    location: "Conference Room",
    purchaseDate: new Date("2023-04-01"),
    purchasePrice: 55000,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "none",
    description: "Solid wood conference table with cable management",
  },
  {
    name: "Reception Sofa Set",
    category: "furniture",
    status: "active",
    location: "Reception",
    purchaseDate: new Date("2023-04-01"),
    purchasePrice: 22000,
    currency: "GMD",
    condition: "fair",
    depreciationMethod: "none",
  },

  // === Equipment ===
  {
    name: "Industrial Generator — 20KVA",
    category: "equipment",
    status: "active",
    brand: "Perkins",
    model: "P20-1S",
    serialNumber: "PKS-20KVA-001",
    location: "Generator Room",
    purchaseDate: new Date("2022-09-15"),
    purchasePrice: 380000,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 120,
    salvageValue: 50000,
    notes: "Last serviced January 2026. Next service due April 2026.",
  },
  {
    name: "Ricoh Aficio MP C307 Copier",
    category: "equipment",
    status: "in_maintenance",
    brand: "Ricoh",
    model: "Aficio MP C307",
    serialNumber: "RC-MPC307-001",
    location: "Print Room",
    purchaseDate: new Date("2024-01-10"),
    purchasePrice: 48000,
    currency: "GMD",
    condition: "fair",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 60,
    salvageValue: 3000,
    notes: "Paper jam issue — technician scheduled for 2026-03-25",
  },
  {
    name: "Projector — Epson EB-X51",
    category: "equipment",
    status: "active",
    brand: "Epson",
    model: "EB-X51",
    serialNumber: "EP-X51-001",
    location: "Conference Room",
    purchaseDate: new Date("2024-06-20"),
    purchasePrice: 14500,
    currency: "GMD",
    condition: "good",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 60,
    salvageValue: 500,
  },

  // === Vehicle ===
  {
    name: "Toyota Hilux 2.8 GD-6 — Company Vehicle",
    category: "vehicle",
    status: "active",
    brand: "Toyota",
    model: "Hilux 2.8 GD-6",
    serialNumber: "VIN-GM-2024-HLX-001",
    location: "Car Park",
    purchaseDate: new Date("2024-02-28"),
    purchasePrice: 650000,
    currency: "GMD",
    warrantyExpiry: new Date("2027-02-28"),
    condition: "good",
    depreciationMethod: "declining_balance",
    usefulLifeMonths: 84,
    salvageValue: 120000,
    description: "Primary company vehicle for operations and deliveries",
  },

  // === Retired ===
  {
    name: "HP EliteBook 840 G5 (Retired)",
    category: "technology",
    status: "retired",
    brand: "HP",
    model: "EliteBook 840 G5",
    serialNumber: "HP-840G5-OLD-001",
    location: "Storage",
    purchaseDate: new Date("2019-06-01"),
    purchasePrice: 45000,
    currency: "GMD",
    condition: "poor",
    depreciationMethod: "straight_line",
    usefulLifeMonths: 48,
    salvageValue: 2000,
    notes: "Decommissioned — replaced by Dell Precision 7680",
  },
];

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

  // Asset settings
  await prisma.assetSettings.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, assetPrefix: "AST", nextAssetNumber: 1 },
    update: {},
  });

  console.log("Seeding assets...");
  let counter = 1;

  for (const a of ASSETS) {
    const assetNumber = `AST-${String(counter).padStart(4, "0")}`;
    const existing = await prisma.asset.findFirst({
      where: { tenantId: tenant.id, name: a.name },
    });
    if (existing) {
      console.log(`  Asset already exists: ${existing.assetNumber} — ${a.name}`);
      counter++;
      continue;
    }

    const asset = await prisma.asset.create({
      data: {
        tenantId: tenant.id,
        assetNumber,
        name: a.name,
        description: a.description ?? null,
        category: a.category,
        status: a.status,
        serialNumber: a.serialNumber ?? null,
        brand: a.brand ?? null,
        model: a.model ?? null,
        location: a.location ?? null,
        purchaseDate: a.purchaseDate ?? null,
        purchasePrice: a.purchasePrice ?? null,
        currency: a.currency ?? "GMD",
        warrantyExpiry: a.warrantyExpiry ?? null,
        condition: a.condition,
        depreciationMethod: a.depreciationMethod ?? null,
        usefulLifeMonths: a.usefulLifeMonths ?? null,
        salvageValue: a.salvageValue ?? null,
        currentValue: a.purchasePrice ?? null,
        notes: a.notes ?? null,
      },
    });

    // Assign active assets to the office location
    if (a.status === "active" && a.location) {
      await prisma.assetAssignment.create({
        data: {
          assetId: asset.id,
          location: a.location,
          assignedById: user.id,
          assignedDate: a.purchaseDate ?? new Date(),
        },
      });
    }

    // Add maintenance record for in_maintenance assets
    if (a.status === "in_maintenance") {
      await prisma.assetMaintenance.create({
        data: {
          assetId: asset.id,
          title: "Scheduled Maintenance",
          description: a.notes ?? "Routine maintenance",
          maintenanceDate: new Date(),
          nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "in_progress",
        },
      });
    }

    console.log(`  Created asset: ${assetNumber} — ${a.name} (${a.status})`);
    counter++;
  }

  // Update settings counter
  await prisma.assetSettings.update({
    where: { tenantId: tenant.id },
    data: { nextAssetNumber: counter },
  });

  console.log(`\nDone! ${counter - 1} assets seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
