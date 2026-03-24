import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { EXPENSE_CATEGORIES } from "../src/lib/expense-constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const SAMPLE_EXPENSES = [
  // Reimbursed
  { title: "Flight to Banjul — Client Site Visit", category: "travel", amount: 450.00, daysAgo: 75, status: "reimbursed" as const },
  { title: "Hotel — Client Meeting (3 nights)", category: "accommodation", amount: 320.00, daysAgo: 72, status: "reimbursed" as const },
  { title: "Team Lunch — Q1 Planning", category: "meals", amount: 85.50, daysAgo: 60, status: "reimbursed" as const },
  { title: "Office Printer Paper & Toner", category: "office_supplies", amount: 42.00, daysAgo: 55, status: "reimbursed" as const },

  // Approved
  { title: "Training — Project Management Certification", category: "training", amount: 780.00, daysAgo: 40, status: "approved" as const },
  { title: "Internet Dongle — Remote Work", category: "communication", amount: 35.00, daysAgo: 35, status: "approved" as const },
  { title: "Business Dinner — Prospective Client", category: "entertainment", amount: 210.00, daysAgo: 30, status: "approved" as const },

  // Rejected
  { title: "Personal Groceries", category: "other", amount: 95.00, daysAgo: 28, status: "rejected" as const, notes: "This does not qualify as a business expense." },

  // Submitted (pending review)
  { title: "Fuel — Field Visit to Kololi", category: "travel", amount: 55.00, daysAgo: 10, status: "submitted" as const },
  { title: "Laptop Stand & Mouse", category: "equipment", amount: 125.00, daysAgo: 8, status: "submitted" as const },
  { title: "Staff Medical Checkup", category: "medical", amount: 190.00, daysAgo: 6, status: "submitted" as const },
  { title: "Conference Registration — West Africa HR Summit", category: "training", amount: 600.00, daysAgo: 5, status: "submitted" as const },

  // Draft
  { title: "Monthly Phone Bill Reimbursement", category: "communication", amount: 28.00, daysAgo: 2, status: "draft" as const },
  { title: "Office Cleaning Supplies", category: "office_supplies", amount: 18.50, daysAgo: 1, status: "draft" as const },
  { title: "Team Snacks — Sprint Review", category: "meals", amount: 47.00, daysAgo: 0, status: "draft" as const },
];

async function main() {
  const owner = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!owner) { console.error("No owner business found."); process.exit(1); }

  const user = await prisma.user.findFirst();
  if (!user) { console.error("No user found."); process.exit(1); }

  const employees = await prisma.employee.findMany({
    where: { tenantId: owner.id, status: { in: ["active", "on_leave"] } },
    select: { id: true, firstName: true, lastName: true },
    take: 10,
  });
  if (employees.length === 0) { console.error("No employees found."); process.exit(1); }

  console.log(`Seeding expenses for tenant: ${owner.name}`);

  // Upsert categories
  await prisma.$transaction(
    EXPENSE_CATEGORIES.map((c) =>
      prisma.expenseCategory.upsert({
        where: { value: c.value },
        create: { value: c.value, label: c.label },
        update: { label: c.label },
      })
    )
  );
  console.log(`  ✓ ${EXPENSE_CATEGORIES.length} categories upserted`);

  const categories = await prisma.expenseCategory.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.value, c.id]));

  // Clear existing expenses
  await prisma.expense.deleteMany({ where: { tenantId: owner.id } });

  let created = 0;
  for (const [i, sample] of SAMPLE_EXPENSES.entries()) {
    const employee = employees[i % employees.length];
    const categoryId = catMap[sample.category];
    if (!categoryId) continue;

    const expenseDate = daysAgo(sample.daysAgo);
    const isReviewed = ["approved", "rejected", "reimbursed"].includes(sample.status);
    const isReimbursed = sample.status === "reimbursed";

    await prisma.expense.create({
      data: {
        tenantId: owner.id,
        submittedById: user.id,
        employeeId: employee.id,
        title: sample.title,
        amount: sample.amount,
        currency: "GMD",
        categoryId,
        expenseDate,
        status: sample.status,
        notes: sample.status === "rejected" ? (sample.notes ?? null) : null,
        reviewedById: isReviewed ? user.id : null,
        reviewedAt: isReviewed ? new Date(expenseDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        reimbursedAt: isReimbursed ? new Date(expenseDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
      },
    });
    created++;
  }

  console.log(`  ✓ ${created} expenses created`);
  console.log("\nExpense seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
