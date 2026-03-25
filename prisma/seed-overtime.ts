import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!tenant) throw new Error("No owner business found. Run the main seed first.");

  const employees = await prisma.employee.findMany({
    where: { tenantId: tenant.id, status: { notIn: ["terminated", "resigned"] } },
    select: { id: true, firstName: true, lastName: true },
    take: 8,
  });

  if (employees.length === 0) throw new Error("No employees found. Seed employees first.");

  // Find or create a reviewer
  const reviewer = employees[0];
  const others = employees.slice(1);

  const now = new Date();

  const overtimeData = [
    { employeeIdx: 0, daysAgo: 2, hours: 3, reason: "Month-end financial reporting deadline", status: "approved" },
    { employeeIdx: 1, daysAgo: 5, hours: 2, reason: "Client presentation preparation", status: "approved" },
    { employeeIdx: 2, daysAgo: 8, hours: 4.5, reason: "System migration support over the weekend", status: "approved" },
    { employeeIdx: 3, daysAgo: 10, hours: 2, reason: "Staff training session facilitation", status: "pending" },
    { employeeIdx: 4, daysAgo: 12, hours: 3.5, reason: "Emergency server maintenance", status: "pending" },
    { employeeIdx: 5, daysAgo: 15, hours: 1.5, reason: "Board meeting minutes documentation", status: "rejected" },
    { employeeIdx: 6, daysAgo: 20, hours: 5, reason: "Annual audit support — document preparation", status: "approved" },
    { employeeIdx: 7, daysAgo: 25, hours: 2.5, reason: "Year-end inventory count", status: "approved" },
    { employeeIdx: 0, daysAgo: 30, hours: 3, reason: "Q1 budget review and forecasting", status: "approved" },
    { employeeIdx: 1, daysAgo: 35, hours: 4, reason: "Network infrastructure upgrade", status: "approved" },
  ];

  let created = 0;
  for (const row of overtimeData) {
    const emp = employees[row.employeeIdx % employees.length];
    const date = new Date(now);
    date.setDate(date.getDate() - row.daysAgo);

    const existing = await prisma.overtimeRequest.findFirst({
      where: { tenantId: tenant.id, employeeId: emp.id, date },
    });
    if (existing) continue;

    await prisma.overtimeRequest.create({
      data: {
        tenantId: tenant.id,
        employeeId: emp.id,
        date,
        hours: row.hours,
        reason: row.reason,
        status: row.status,
        reviewedById: row.status !== "pending" ? reviewer.id : null,
        reviewedAt: row.status !== "pending" ? new Date(date.getTime() + 86400000) : null,
        reviewNote: row.status === "rejected" ? "Does not meet overtime criteria for this period" : null,
      },
    });
    created++;
  }

  console.log(`✓ Created ${created} overtime records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
