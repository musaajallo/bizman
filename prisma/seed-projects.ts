import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULT_STATUSES = [
  { name: "To Do", color: "#6B7280", group: "not_started", order: 0, isDefault: true },
  { name: "In Progress", color: "#3B82F6", group: "active", order: 1, isDefault: false },
  { name: "Review", color: "#F59E0B", group: "active", order: 2, isDefault: false },
  { name: "Done", color: "#22C55E", group: "done", order: 3, isDefault: false },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startMonths: number, endMonths: number): Date {
  const now = Date.now();
  const start = now + startMonths * 30 * 24 * 60 * 60 * 1000;
  const end = now + endMonths * 30 * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (end - start));
}

function randomBudget(): number {
  return Math.round(Math.random() * 150000 + 500);
}

const categoryNames = [
  "Web Development", "Mobile App", "Branding", "Consulting",
  "Data Analytics", "UI/UX Design", "Marketing", "IT Infrastructure",
  "E-Commerce", "Content Strategy",
];

const projectNames = [
  "Website Redesign", "Mobile App MVP", "Brand Identity Refresh",
  "Annual Report Design", "CRM Integration", "Social Media Campaign",
  "E-Commerce Platform", "Data Migration", "SEO Optimization",
  "Marketing Automation", "Cloud Infrastructure Setup", "API Development",
  "User Research Study", "Payment Gateway Integration", "Corporate Intranet",
  "Customer Portal", "Supply Chain Dashboard", "Inventory Management System",
  "HR Onboarding Platform", "Learning Management System",
  "Email Marketing Revamp", "Event Management App", "Loyalty Program Design",
  "Chatbot Implementation", "Analytics Dashboard",
  "Product Launch Campaign", "Digital Transformation Strategy",
  "Employee Wellness App", "Fleet Management System", "POS Integration",
  "Document Management", "Compliance Audit Tool", "Recruitment Portal",
  "Vendor Management Platform", "Financial Reporting Module",
  "Customer Feedback System", "Booking Platform", "Property Listing Site",
  "Restaurant Ordering App", "Fitness Tracking App",
  "Travel Agency Website", "Insurance Claims Portal", "Legal Case Tracker",
  "Warehouse Automation", "Smart Parking System",
  "Telemedicine Platform", "School Management System",
  "NGO Donation Portal", "Agricultural Monitoring Dashboard",
  "Government Services Portal",
];

const individualNames = [
  "Amadou Jallow", "Fatou Ceesay", "Lamin Touray", "Mariama Bah",
  "Ousman Sanneh", "Isatou Njie", "Ebrima Jammeh", "Binta Camara",
  "Modou Jobe", "Awa Drammeh", "Saikou Fatty", "Hawa Sowe",
  "Kebba Darboe", "Adama Manneh", "Musa Sonko",
];

const orgNames = [
  "Zenith Technologies", "Sahel Innovations", "GreenBridge Consulting",
  "Atlantic Digital", "West Coast Ventures", "Seaview Properties",
  "TerraFirma Engineering", "BlueWave Media", "Sahara Logistics",
  "PanAfrican Solutions", "Baobab Trading Co", "Savanna Health Group",
  "Kora Financial Services", "Mandingo Imports", "Senegambia Textiles",
];

const statuses = ["not_started", "in_progress", "on_hold", "completed", "cancelled"];
const priorities = ["low", "medium", "high", "urgent"];
const types = ["client", "internal", "retainer"];
const clientTypes: ("internal" | "individual" | "organization")[] = ["internal", "individual", "organization"];
const billingTypes = ["fixed", "hourly", "retainer", "pro_bono"];
const currencies = ["USD", "EUR", "GBP", "GMD", "NGN", "GHS", "KES", "ZAR"];

const taskTitles = [
  "Setup project repository", "Create wireframes", "Design mockups",
  "Develop authentication", "Build landing page", "Write API endpoints",
  "Setup CI/CD pipeline", "Database schema design", "User testing session",
  "Performance optimization", "Security audit", "Deploy to staging",
  "Client review meeting", "Bug fixes sprint", "Documentation",
  "Integration testing", "Load testing", "Accessibility review",
  "SEO implementation", "Analytics setup", "Notification system",
  "Search functionality", "Export/import features", "Admin dashboard",
  "Multi-language support", "Mobile responsiveness", "Dark mode support",
  "Payment integration", "Email templates", "Data visualization",
];

async function main() {
  console.log("Seeding projects...");

  // Get or create required entities
  const owner = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!owner) throw new Error("No owner business found. Sign up first.");

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found. Sign up first.");

  // Get existing client tenants
  const clientTenants = await prisma.tenant.findMany({ where: { isOwnerBusiness: false } });

  // Seed categories
  const categoryRecords = [];
  for (let i = 0; i < categoryNames.length; i++) {
    const cat = await prisma.projectCategory.upsert({
      where: { tenantId_name: { tenantId: owner.id, name: categoryNames[i] } },
      update: {},
      create: { tenantId: owner.id, name: categoryNames[i], order: i },
    });
    categoryRecords.push(cat);
  }
  console.log(`  Created ${categoryRecords.length} categories`);

  // Seed 50 projects
  for (let i = 0; i < 50; i++) {
    const name = i < projectNames.length
      ? projectNames[i]
      : `${projectNames[i % projectNames.length]} v${Math.floor(i / projectNames.length) + 1}`;

    const slug = slugify(name);
    const clientType = randomFrom(clientTypes);
    const status = randomFrom(statuses);
    const isRolling = Math.random() > 0.7;
    const hasEndDate = !isRolling && Math.random() > 0.3;
    const progress = status === "completed" ? 100
      : status === "cancelled" ? Math.floor(Math.random() * 40)
      : status === "not_started" ? 0
      : Math.floor(Math.random() * 90);

    const startDate = randomDate(-6, -1);
    const endDate = hasEndDate ? randomDate(0, 6) : null;

    // Build entity fields based on clientType
    let clientTenantId: string | undefined;
    let contactName: string | undefined;
    let contactEmail: string | undefined;
    let contactPhone: string | undefined;
    let orgName: string | undefined;
    let orgAddress: string | undefined;
    let orgContactName: string | undefined;
    let orgContactEmail: string | undefined;
    let orgContactPhone: string | undefined;

    if (clientType === "individual") {
      const person = randomFrom(individualNames);
      contactName = person;
      contactEmail = person.toLowerCase().replace(/\s+/g, ".") + "@email.com";
      contactPhone = `+220 ${Math.floor(Math.random() * 9000000 + 1000000)}`;
    } else if (clientType === "organization") {
      if (clientTenants.length > 0 && Math.random() > 0.4) {
        clientTenantId = randomFrom(clientTenants).id;
      } else {
        const org = randomFrom(orgNames);
        orgName = org;
        orgAddress = `${Math.floor(Math.random() * 200 + 1)} ${randomFrom(["Kairaba Ave", "Sait Matty Rd", "Pipeline", "Bakau", "Serrekunda West", "Westfield"])}`;
        orgContactName = randomFrom(individualNames);
        orgContactEmail = orgContactName.toLowerCase().replace(/\s+/g, ".") + `@${org.toLowerCase().replace(/\s+/g, "")}.com`;
        orgContactPhone = `+220 ${Math.floor(Math.random() * 9000000 + 1000000)}`;
      }
    }

    const project = await prisma.project.create({
      data: {
        tenantId: owner.id,
        name,
        slug: `${slug}-${i}`,
        description: `Project ${i + 1}: ${name}. This project involves comprehensive work across multiple phases.`,
        status,
        priority: randomFrom(priorities),
        type: randomFrom(types),
        clientType,
        startDate,
        endDate,
        isRolling,
        contactName,
        contactEmail,
        contactPhone,
        clientTenantId,
        orgName,
        orgAddress,
        orgContactName,
        orgContactEmail,
        orgContactPhone,
        billingType: randomFrom(billingTypes),
        budgetAmount: randomBudget(),
        budgetCurrency: randomFrom(currencies),
        hourlyRate: Math.random() > 0.5 ? Math.round(Math.random() * 200 + 25) : undefined,
        categoryId: randomFrom(categoryRecords).id,
        progress,
        notes: Math.random() > 0.6 ? `Notes for ${name}: Key deliverables and milestones to track.` : undefined,
        createdById: user.id,
      },
    });

    // Seed default statuses
    await prisma.projectStatus.createMany({
      data: DEFAULT_STATUSES.map((s) => ({ ...s, projectId: project.id })),
    });

    // Add creator as lead
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: "lead" },
    });

    // Add 2-5 random tasks per project
    const statuses_ = await prisma.projectStatus.findMany({
      where: { projectId: project.id },
      orderBy: { order: "asc" },
    });

    const taskCount = Math.floor(Math.random() * 4) + 2;
    const shuffledTasks = [...taskTitles].sort(() => Math.random() - 0.5);
    for (let t = 0; t < taskCount; t++) {
      const taskStatus = randomFrom(statuses_);
      const isComplete = taskStatus.group === "done" || taskStatus.group === "closed";
      await prisma.task.create({
        data: {
          projectId: project.id,
          statusId: taskStatus.id,
          title: shuffledTasks[t % shuffledTasks.length],
          priority: randomFrom(priorities),
          order: t,
          assigneeId: user.id,
          dueDate: Math.random() > 0.5 ? randomDate(-1, 3) : undefined,
          completedAt: isComplete ? new Date() : undefined,
          createdById: user.id,
        },
      });
    }

    if ((i + 1) % 10 === 0) console.log(`  Created ${i + 1}/50 projects`);
  }

  console.log("Done! 50 projects seeded with categories, tasks, and members.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
