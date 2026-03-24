import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

type EntryDef = {
  dayOffset: number; // 0=Mon, 1=Tue, ...
  hours: number;
  category: string;
  description?: string;
};

type TimesheetDef = {
  employeeIdx: number;
  weekOffsetFromCurrent: number; // 0=this week, -1=last week, etc.
  status: "draft" | "submitted" | "approved" | "rejected";
  entries: EntryDef[];
  reviewNote?: string;
};

const TIMESHEETS: TimesheetDef[] = [
  // Current week — various employees, mixed statuses
  { employeeIdx: 0, weekOffsetFromCurrent: 0, status: "draft",
    entries: [
      { dayOffset: 0, hours: 8, category: "work" },
      { dayOffset: 1, hours: 8, category: "work" },
      { dayOffset: 2, hours: 7, category: "work", description: "Left early for appointment" },
      { dayOffset: 2, hours: 1, category: "admin", description: "HR paperwork" },
    ]
  },
  { employeeIdx: 1, weekOffsetFromCurrent: 0, status: "submitted",
    entries: [
      { dayOffset: 0, hours: 8, category: "work" },
      { dayOffset: 1, hours: 3, category: "meeting", description: "Q1 planning" },
      { dayOffset: 1, hours: 5, category: "work" },
      { dayOffset: 2, hours: 8, category: "work" },
      { dayOffset: 3, hours: 8, category: "work" },
      { dayOffset: 4, hours: 8, category: "work" },
    ]
  },
  { employeeIdx: 2, weekOffsetFromCurrent: 0, status: "submitted",
    entries: [
      { dayOffset: 0, hours: 8, category: "training", description: "New system onboarding" },
      { dayOffset: 1, hours: 8, category: "work" },
      { dayOffset: 2, hours: 8, category: "work" },
      { dayOffset: 3, hours: 4, category: "sick", description: "Unwell" },
      { dayOffset: 3, hours: 4, category: "work" },
      { dayOffset: 4, hours: 8, category: "work" },
    ]
  },
  // Last week
  { employeeIdx: 0, weekOffsetFromCurrent: -1, status: "approved",
    entries: [
      { dayOffset: 0, hours: 8, category: "work" },
      { dayOffset: 1, hours: 8, category: "work" },
      { dayOffset: 2, hours: 2, category: "meeting", description: "Monthly review" },
      { dayOffset: 2, hours: 6, category: "work" },
      { dayOffset: 3, hours: 8, category: "work" },
      { dayOffset: 4, hours: 8, category: "work" },
    ]
  },
  { employeeIdx: 1, weekOffsetFromCurrent: -1, status: "approved",
    entries: [
      { dayOffset: 0, hours: 8, category: "work" },
      { dayOffset: 1, hours: 8, category: "work" },
      { dayOffset: 2, hours: 8, category: "work" },
      { dayOffset: 3, hours: 4, category: "travel", description: "Client site visit" },
      { dayOffset: 3, hours: 4, category: "work" },
      { dayOffset: 4, hours: 8, category: "work" },
    ]
  },
  { employeeIdx: 3, weekOffsetFromCurrent: -1, status: "rejected",
    reviewNote: "Hours exceed 40h/week without overtime approval. Please resubmit with correct hours.",
    entries: [
      { dayOffset: 0, hours: 10, category: "work" },
      { dayOffset: 1, hours: 10, category: "work" },
      { dayOffset: 2, hours: 10, category: "work" },
      { dayOffset: 3, hours: 10, category: "work" },
      { dayOffset: 4, hours: 10, category: "work" },
    ]
  },
  // 2 weeks ago
  { employeeIdx: 0, weekOffsetFromCurrent: -2, status: "approved",
    entries: [
      { dayOffset: 0, hours: 8, category: "work" },
      { dayOffset: 1, hours: 8, category: "work" },
      { dayOffset: 2, hours: 8, category: "work" },
      { dayOffset: 3, hours: 8, category: "work" },
      { dayOffset: 4, hours: 8, category: "work" },
    ]
  },
  { employeeIdx: 2, weekOffsetFromCurrent: -2, status: "approved",
    entries: [
      { dayOffset: 0, hours: 8, category: "work" },
      { dayOffset: 1, hours: 8, category: "work" },
      { dayOffset: 2, hours: 3, category: "admin", description: "Year-end documentation" },
      { dayOffset: 2, hours: 5, category: "work" },
      { dayOffset: 3, hours: 8, category: "work" },
      { dayOffset: 4, hours: 8, category: "work" },
    ]
  },
];

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!tenant) {
    console.error("No owner business found. Run the main seed first.");
    process.exit(1);
  }

  const employees = await prisma.employee.findMany({
    where: { tenantId: tenant.id, status: "active" },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: { id: true, firstName: true, lastName: true },
  });

  if (employees.length < 4) {
    console.error(`Need at least 4 active employees, found ${employees.length}.`);
    process.exit(1);
  }

  console.log(`Seeding timesheets for ${employees.slice(0, 4).map((e) => `${e.firstName} ${e.lastName}`).join(", ")}...`);

  const now = new Date();
  const thisWeekStart = getWeekStart(now);

  let count = 0;

  for (const def of TIMESHEETS) {
    const emp = employees[def.employeeIdx];
    const weekStart = new Date(thisWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() + def.weekOffsetFromCurrent * 7);

    // Check for existing
    const existing = await prisma.timesheet.findUnique({
      where: {
        tenantId_employeeId_weekStart: {
          tenantId: tenant.id,
          employeeId: emp.id,
          weekStart,
        },
      },
    });
    if (existing) {
      console.log(`  Skipping: ${emp.firstName} ${emp.lastName} — week of ${weekStart.toISOString().slice(0, 10)} (already exists)`);
      continue;
    }

    const totalHours = def.entries.reduce((s, e) => s + e.hours, 0);
    const now2 = new Date();

    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId: tenant.id,
        employeeId: emp.id,
        weekStart,
        status: def.status,
        totalHours,
        submittedAt: ["submitted", "approved", "rejected"].includes(def.status) ? now2 : null,
        reviewedAt: ["approved", "rejected"].includes(def.status) ? now2 : null,
        notes: def.reviewNote ?? null,
        entries: {
          create: def.entries.map((e) => ({
            date: addDays(weekStart, e.dayOffset),
            hours: e.hours,
            category: e.category,
            description: e.description ?? null,
          })),
        },
      },
    });

    count++;
    console.log(`  Created: ${emp.firstName} ${emp.lastName} — week of ${weekStart.toISOString().slice(0, 10)} (${def.status}, ${totalHours}h)`);
  }

  console.log(`\nDone! ${count} timesheets seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
