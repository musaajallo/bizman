import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!tenant) {
    console.error("❌  No owner business found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`✔  Tenant: ${tenant.name} (${tenant.id})`);

  // Fetch employees to link to loans
  const employees = await prisma.employee.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (employees.length === 0) {
    console.warn("⚠  No employees found — staff loans will use borrowerName only.");
  } else {
    console.log(`✔  Found ${employees.length} employees to link loans to`);
    for (const e of employees) {
      console.log(`     • ${e.firstName} ${e.lastName} (${e.id})`);
    }
  }

  // Counter for loan numbers
  const existing = await prisma.loan.count({ where: { tenantId: tenant.id } });
  if (existing > 0) {
    console.log(`ℹ  ${existing} loans already exist — skipping (run a delete first to re-seed).`);
    return;
  }

  function empOrOwner(index: number): { employeeId: string | null; borrowerName: string } {
    if (employees.length === 0) return { employeeId: null, borrowerName: "Staff Member" };
    const e = employees[index % employees.length];
    return { employeeId: e.id, borrowerName: `${e.firstName} ${e.lastName}` };
  }

  const loansData = [
    // ── Staff Loans ──────────────────────────────────────────────────────────
    {
      loanNumber: "LN-2025-001",
      loanType: "staff_loan",
      ...empOrOwner(0),
      principal: 15000,
      interestRate: 5,
      repaymentSchedule: "monthly",
      repaymentAmount: 1375,
      disbursementDate: d(2025, 2, 1),
      status: "settled",
      currency: "GMD",
      notes: "Personal emergency — fully repaid.",
    },
    {
      loanNumber: "LN-2025-002",
      loanType: "staff_loan",
      ...empOrOwner(1),
      principal: 25000,
      interestRate: 4,
      repaymentSchedule: "monthly",
      repaymentAmount: 2166.67,
      disbursementDate: d(2025, 4, 15),
      status: "active",
      currency: "GMD",
      notes: "Home renovation loan.",
    },
    {
      loanNumber: "LN-2025-003",
      loanType: "salary_advance",
      ...empOrOwner(2),
      principal: 5000,
      interestRate: 0,
      repaymentSchedule: "monthly",
      repaymentAmount: 5000,
      disbursementDate: d(2025, 6, 1),
      status: "settled",
      currency: "GMD",
      notes: "Salary advance — deducted from June payroll.",
      payrollDeduction: true,
    },
    {
      loanNumber: "LN-2025-004",
      loanType: "staff_loan",
      ...empOrOwner(3),
      principal: 30000,
      interestRate: 6,
      repaymentSchedule: "monthly",
      repaymentAmount: 2750,
      disbursementDate: d(2025, 7, 10),
      status: "active",
      currency: "GMD",
      notes: "School fees assistance.",
    },
    {
      loanNumber: "LN-2025-005",
      loanType: "salary_advance",
      ...empOrOwner(4),
      principal: 3500,
      interestRate: 0,
      repaymentSchedule: "monthly",
      repaymentAmount: 3500,
      disbursementDate: d(2025, 8, 1),
      status: "settled",
      currency: "GMD",
      payrollDeduction: true,
      notes: "Advance repaid via August payroll.",
    },
    {
      loanNumber: "LN-2025-006",
      loanType: "staff_loan",
      ...empOrOwner(0),
      principal: 20000,
      interestRate: 5,
      repaymentSchedule: "monthly",
      repaymentAmount: 1833.33,
      disbursementDate: d(2025, 9, 1),
      status: "active",
      currency: "GMD",
      notes: "Medical expenses loan.",
    },
    {
      loanNumber: "LN-2025-007",
      loanType: "staff_loan",
      ...empOrOwner(5),
      principal: 10000,
      interestRate: 4,
      repaymentSchedule: "monthly",
      repaymentAmount: 916.67,
      disbursementDate: d(2025, 10, 15),
      status: "active",
      currency: "GMD",
      notes: "Vehicle repair assistance.",
    },
    {
      loanNumber: "LN-2025-008",
      loanType: "salary_advance",
      ...empOrOwner(1),
      principal: 6000,
      interestRate: 0,
      repaymentSchedule: "monthly",
      repaymentAmount: 6000,
      disbursementDate: d(2025, 11, 1),
      status: "active",
      currency: "GMD",
      payrollDeduction: true,
      notes: "December advance — repayment pending.",
    },
    // ── Owner Loans ──────────────────────────────────────────────────────────
    {
      loanNumber: "LN-2025-OWN-001",
      loanType: "owner_loan",
      employeeId: null,
      borrowerName: tenant.name,
      principal: 200000,
      interestRate: 8,
      repaymentSchedule: "monthly",
      repaymentAmount: 18333.33,
      disbursementDate: d(2025, 1, 15),
      status: "active",
      currency: "GMD",
      notes: "Business expansion capital injected by owner.",
    },
    {
      loanNumber: "LN-2025-OWN-002",
      loanType: "owner_loan",
      employeeId: null,
      borrowerName: tenant.name,
      principal: 50000,
      interestRate: 0,
      repaymentSchedule: "lump_sum",
      repaymentAmount: 50000,
      disbursementDate: d(2025, 8, 1),
      status: "settled",
      currency: "GMD",
      notes: "Short-term owner drawdown — repaid in full.",
    },
    // ── 2026 Loans ───────────────────────────────────────────────────────────
    {
      loanNumber: "LN-2026-001",
      loanType: "staff_loan",
      ...empOrOwner(2),
      principal: 40000,
      interestRate: 5,
      repaymentSchedule: "monthly",
      repaymentAmount: 3666.67,
      disbursementDate: d(2026, 1, 10),
      status: "active",
      currency: "GMD",
      notes: "Property deposit assistance.",
    },
    {
      loanNumber: "LN-2026-002",
      loanType: "salary_advance",
      ...empOrOwner(3),
      principal: 4500,
      interestRate: 0,
      repaymentSchedule: "monthly",
      repaymentAmount: 4500,
      disbursementDate: d(2026, 2, 1),
      status: "active",
      currency: "GMD",
      payrollDeduction: true,
      notes: "February advance.",
    },
    {
      loanNumber: "LN-2026-003",
      loanType: "staff_loan",
      ...empOrOwner(6),
      principal: 12000,
      interestRate: 4.5,
      repaymentSchedule: "monthly",
      repaymentAmount: 1100,
      disbursementDate: d(2026, 3, 5),
      status: "disbursed",
      currency: "GMD",
      notes: "New employee relocation assistance.",
    },
    {
      loanNumber: "LN-2026-004",
      loanType: "staff_loan",
      ...empOrOwner(7),
      principal: 8000,
      interestRate: 5,
      repaymentSchedule: "monthly",
      repaymentAmount: 750,
      disbursementDate: null,
      status: "approved",
      currency: "GMD",
      notes: "Approved — awaiting disbursement.",
    },
    {
      loanNumber: "LN-2026-005",
      loanType: "staff_loan",
      ...empOrOwner(4),
      principal: 18000,
      interestRate: 5,
      repaymentSchedule: "monthly",
      repaymentAmount: 1650,
      disbursementDate: null,
      status: "applied",
      currency: "GMD",
      notes: "Under review.",
    },
  ];

  console.log(`→  Creating ${loansData.length} loans...`);
  const created: string[] = [];

  for (const l of loansData) {
    const loan = await prisma.loan.create({
      data: {
        tenantId:          tenant.id,
        loanNumber:        l.loanNumber,
        loanType:          l.loanType,
        employeeId:        l.employeeId,
        borrowerName:      l.borrowerName,
        principal:         l.principal,
        interestRate:      l.interestRate,
        currency:          l.currency,
        repaymentSchedule: l.repaymentSchedule,
        repaymentAmount:   l.repaymentAmount ?? null,
        disbursementDate:  l.disbursementDate ?? null,
        status:            l.status,
        payrollDeduction:  (l as { payrollDeduction?: boolean }).payrollDeduction ?? false,
        notes:             l.notes ?? null,
      },
    });
    created.push(loan.id);
    console.log(`   ✔  ${l.loanNumber} — ${l.borrowerName} (${l.loanType}, ${l.status})`);
  }

  // ── Repayments for settled & active loans ─────────────────────────────────
  console.log("→  Adding repayments...");

  // Helper: add N monthly repayments for a loan by index
  async function addRepayments(
    loanIdx: number,
    count: number,
    amount: number,
    startYear: number,
    startMonth: number,
    method: string = "bank_transfer"
  ) {
    const loanId = created[loanIdx];
    for (let i = 0; i < count; i++) {
      const paidAt = d(startYear, startMonth + i, 5);
      await prisma.loanRepayment.create({
        data: { loanId, tenantId: tenant!.id, amount, method, paidAt },
      });
    }
  }

  // LN-2025-001 — settled (11 monthly payments)
  await addRepayments(0, 11, 1375, 2025, 3);

  // LN-2025-002 — active (11 monthly payments so far)
  await addRepayments(1, 11, 2166.67, 2025, 5);

  // LN-2025-003 — settled salary advance (1 payroll deduction)
  await prisma.loanRepayment.create({
    data: { loanId: created[2], tenantId: tenant.id, amount: 5000, method: "payroll_deduction", paidAt: d(2025, 7, 31) },
  });

  // LN-2025-004 — active (8 monthly payments)
  await addRepayments(3, 8, 2750, 2025, 8);

  // LN-2025-005 — settled advance
  await prisma.loanRepayment.create({
    data: { loanId: created[4], tenantId: tenant.id, amount: 3500, method: "payroll_deduction", paidAt: d(2025, 9, 30) },
  });

  // LN-2025-006 — active (6 monthly payments)
  await addRepayments(5, 6, 1833.33, 2025, 10);

  // LN-2025-007 — active (5 monthly payments)
  await addRepayments(6, 5, 916.67, 2025, 11);

  // LN-2025-OWN-001 — active (14 monthly payments)
  await addRepayments(8, 14, 18333.33, 2025, 2);

  // LN-2025-OWN-002 — settled (lump sum)
  await prisma.loanRepayment.create({
    data: { loanId: created[9], tenantId: tenant.id, amount: 50000, method: "bank_transfer", paidAt: d(2025, 11, 1) },
  });

  // LN-2026-001 — active (2 months)
  await addRepayments(10, 2, 3666.67, 2026, 2);

  // LN-2026-002 — active (1 payroll deduction)
  await prisma.loanRepayment.create({
    data: { loanId: created[11], tenantId: tenant.id, amount: 4500, method: "payroll_deduction", paidAt: d(2026, 3, 31) },
  });

  // LN-2026-003 — just disbursed, no repayments yet

  const repaymentCount = await prisma.loanRepayment.count({ where: { tenantId: tenant.id } });

  console.log(`\n✅  Done.`);
  console.log(`   Loans:       ${loansData.length}`);
  console.log(`   Repayments:  ${repaymentCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
