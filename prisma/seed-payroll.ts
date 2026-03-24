import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildPeriodLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

// Returns [{month, year}] for the last N months (most recent last)
function lastNMonths(n: number): { month: number; year: number }[] {
  const results: { month: number; year: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    results.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return results;
}

async function main() {
  const owner = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!owner) {
    console.error("No owner business found. Run the main seed first.");
    process.exit(1);
  }

  console.log(`Seeding payroll for tenant: ${owner.name} (${owner.id})`);

  // Clear existing payroll data for this tenant
  await prisma.payslip.deleteMany({ where: { tenantId: owner.id } });
  await prisma.payrollRun.deleteMany({ where: { tenantId: owner.id } });
  console.log("Cleared existing payroll data.");

  // Fetch all active/on-leave employees with their compensation data
  const employees = await prisma.employee.findMany({
    where: { tenantId: owner.id, status: { in: ["active", "on_leave"] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeNumber: true,
      jobTitle: true,
      department: true,
      basicSalary: true,
      housingAllowance: true,
      transportAllowance: true,
      otherAllowance: true,
      otherAllowanceLabel: true,
      pensionContribution: true,
      hasMedicalAid: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      currency: true,
    },
  });

  if (employees.length === 0) {
    console.error("No active employees found. Run seed-employees first.");
    process.exit(1);
  }

  console.log(`Found ${employees.length} active employees.`);

  // Create 4 months of history: 3 paid, 1 current draft
  const periods = lastNMonths(4);

  for (let periodIdx = 0; periodIdx < periods.length; periodIdx++) {
    const { month, year } = periods[periodIdx];
    const isLatest = periodIdx === periods.length - 1;
    const isPrevious = periodIdx === periods.length - 2;

    // Determine status: oldest 2 → paid, one before latest → processing, latest → draft
    let runStatus: string;
    if (isLatest) {
      runStatus = "draft";
    } else if (isPrevious) {
      runStatus = "processing";
    } else {
      runStatus = "paid";
    }

    const currency = employees[0].currency || "GMD";

    const payslipData = employees.map((e) => {
      const basic = toNum(e.basicSalary);
      const housing = toNum(e.housingAllowance);
      const transport = toNum(e.transportAllowance);
      const other = toNum(e.otherAllowance);
      const gross = basic + housing + transport + other;

      const pensionRate = toNum(e.pensionContribution);
      const pension = parseFloat(((pensionRate / 100) * basic).toFixed(2));

      // PAYE: simplified flat rate tiers (illustrative)
      let paye = 0;
      if (basic > 5000) paye = parseFloat((basic * 0.25).toFixed(2));
      else if (basic > 2500) paye = parseFloat((basic * 0.15).toFixed(2));
      else if (basic > 1000) paye = parseFloat((basic * 0.10).toFixed(2));

      // Medical aid: flat deduction for employees who have it
      const medical = e.hasMedicalAid ? parseFloat((basic * 0.02).toFixed(2)) : 0;

      const totalDed = parseFloat((pension + medical + paye).toFixed(2));
      const net = parseFloat((gross - totalDed).toFixed(2));

      const slipStatus = runStatus === "paid" ? "paid"
        : runStatus === "processing" ? "processed"
        : "pending";

      return {
        employeeId: e.id,
        tenantId: owner.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        employeeNumber: e.employeeNumber,
        jobTitle: e.jobTitle,
        department: e.department,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowance: other,
        otherAllowanceLabel: e.otherAllowanceLabel,
        grossPay: gross,
        pensionRate,
        pensionContribution: pension,
        medicalAidDeduction: medical,
        payeTax: paye,
        otherDeduction: 0,
        otherDeductionLabel: null as string | null,
        totalDeductions: totalDed,
        netPay: net,
        currency: e.currency || currency,
        bankName: e.bankName,
        bankAccountName: e.bankAccountName,
        bankAccountNumber: e.bankAccountNumber,
        status: slipStatus,
      };
    });

    const totalGross = parseFloat(payslipData.reduce((s, p) => s + p.grossPay, 0).toFixed(2));
    const totalDeductions = parseFloat(payslipData.reduce((s, p) => s + p.totalDeductions, 0).toFixed(2));
    const totalNet = parseFloat(payslipData.reduce((s, p) => s + p.netPay, 0).toFixed(2));

    const processedAt = runStatus !== "draft"
      ? new Date(year, month - 1, 28)
      : null;
    const paidAt = runStatus === "paid"
      ? new Date(year, month - 1, 30)
      : null;

    const run = await prisma.$transaction(async (tx) => {
      const payrollRun = await tx.payrollRun.create({
        data: {
          tenantId: owner.id,
          periodMonth: month,
          periodYear: year,
          periodLabel: buildPeriodLabel(month, year),
          currency,
          status: runStatus,
          totalGross,
          totalDeductions,
          totalNet,
          employeeCount: employees.length,
          processedAt,
          paidAt,
        },
      });
      await tx.payslip.createMany({
        data: payslipData.map((p) => ({ ...p, payrollRunId: payrollRun.id })),
      });
      return payrollRun;
    });

    console.log(`  ✓ ${buildPeriodLabel(month, year)} — ${runStatus} (${employees.length} payslips, run ${run.id.slice(-8)})`);
  }

  console.log("\nPayroll seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
