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

  // Ensure leave settings exist
  let leaveSettings = await prisma.leaveSettings.findUnique({ where: { tenantId: tenant.id } });
  if (!leaveSettings) {
    leaveSettings = await prisma.leaveSettings.create({
      data: { tenantId: tenant.id },
    });
  }

  // Ensure leave types exist
  const leaveTypes = ["annual", "sick", "maternity", "paternity", "unpaid", "compassionate"];
  const existingTypes = await prisma.leaveType.findMany({ where: { tenantId: tenant.id } });
  const existingNames = new Set(existingTypes.map((t) => t.name));

  for (const name of leaveTypes) {
    if (existingNames.has(name)) continue;
    await prisma.leaveType.create({
      data: {
        tenantId: tenant.id,
        name,
        defaultDays: name === "annual" ? 21 : name === "maternity" ? 90 : name === "paternity" ? 5 : 10,
        isPaid: name !== "unpaid",
        isActive: true,
      },
    });
  }

  const annualLeave = await prisma.leaveType.findFirst({ where: { tenantId: tenant.id, name: "annual" } });
  const sickLeave = await prisma.leaveType.findFirst({ where: { tenantId: tenant.id, name: "sick" } });
  if (!annualLeave || !sickLeave) throw new Error("Leave types not found after creation.");

  const now = new Date();

  const leaveRequests = [
    // Approved past requests
    { empIdx: 0, leaveType: annualLeave.id, daysFromNow: -60, duration: 5, reason: "Family holiday in Senegal", status: "approved" },
    { empIdx: 1, leaveType: sickLeave.id, daysFromNow: -45, duration: 2, reason: "Flu and fever", status: "approved" },
    { empIdx: 2, leaveType: annualLeave.id, daysFromNow: -30, duration: 3, reason: "Personal travel to Dakar", status: "approved" },
    { empIdx: 3, leaveType: annualLeave.id, daysFromNow: -20, duration: 7, reason: "Annual leave — family event", status: "approved" },
    { empIdx: 4, leaveType: sickLeave.id, daysFromNow: -10, duration: 1, reason: "Medical appointment", status: "approved" },
    // Pending requests
    { empIdx: 5, leaveType: annualLeave.id, daysFromNow: 7, duration: 5, reason: "Planned vacation", status: "pending" },
    { empIdx: 6, leaveType: annualLeave.id, daysFromNow: 14, duration: 3, reason: "Family occasion", status: "pending" },
    { empIdx: 7, leaveType: sickLeave.id, daysFromNow: 0, duration: 2, reason: "Follow-up medical treatment", status: "pending" },
    // One rejected
    { empIdx: 0, leaveType: annualLeave.id, daysFromNow: -5, duration: 10, reason: "Extended leave request", status: "rejected" },
  ];

  let created = 0;
  const approver = employees[0];

  for (const row of leaveRequests) {
    const emp = employees[row.empIdx % employees.length];
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + row.daysFromNow);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + row.duration - 1);

    const existing = await prisma.leaveRequest.findFirst({
      where: { tenantId: tenant.id, employeeId: emp.id, startDate, leaveTypeId: row.leaveType },
    });
    if (existing) continue;

    await prisma.leaveRequest.create({
      data: {
        tenantId: tenant.id,
        employeeId: emp.id,
        leaveTypeId: row.leaveType,
        startDate,
        endDate,
        daysRequested: row.duration,
        reason: row.reason,
        status: row.status,
        reviewedById: row.status !== "pending" ? approver.id : null,
        reviewedAt: row.status !== "pending" ? new Date(startDate.getTime() - 86400000 * 3) : null,
        reviewNote: row.status === "rejected" ? "Insufficient notice given for the duration requested" : null,
      },
    });
    created++;
  }

  console.log(`✓ Created ${created} leave/time-off records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
