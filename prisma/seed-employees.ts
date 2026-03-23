import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function yearsAgo(n: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function pad(n: number, digits = 4): string {
  return String(n).padStart(digits, "0");
}

const departments = ["Engineering", "Finance", "Human Resources", "Operations", "Sales & Marketing", "Legal", "Executive"];
const units = {
  Engineering: ["Frontend", "Backend", "DevOps", "QA"],
  Finance: ["Accounting", "Treasury", "Audit"],
  "Human Resources": ["Recruitment", "Payroll", "L&D"],
  Operations: ["Logistics", "Procurement", "Facilities"],
  "Sales & Marketing": ["Sales", "Digital Marketing", "Brand"],
  Legal: ["Compliance", "Contracts"],
  Executive: ["Strategy", "Office of the CEO"],
};

const jobTitles: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Engineer", "Tech Lead", "Engineering Manager", "QA Engineer", "DevOps Engineer"],
  Finance: ["Accountant", "Senior Accountant", "Finance Manager", "CFO", "Internal Auditor", "Treasury Analyst"],
  "Human Resources": ["HR Officer", "HR Manager", "Recruitment Specialist", "Payroll Officer", "L&D Coordinator", "HR Director"],
  Operations: ["Operations Analyst", "Logistics Coordinator", "Procurement Officer", "Operations Manager", "Facilities Manager"],
  "Sales & Marketing": ["Sales Executive", "Account Manager", "Marketing Coordinator", "Brand Manager", "Head of Sales", "Digital Marketer"],
  Legal: ["Legal Officer", "Compliance Manager", "Contracts Specialist", "General Counsel"],
  Executive: ["CEO", "COO", "Chief of Staff", "Executive Assistant", "Strategy Analyst"],
};

const firstNames = [
  "Amara", "Kwame", "Fatima", "Ibrahim", "Aisha", "Kofi", "Zainab", "Yaw",
  "Nadia", "Seun", "Abena", "Chidi", "Mariama", "Emeka", "Adaeze", "Tunde",
  "Chioma", "Babatunde", "Ngozi", "Musa", "Sade", "Oluwaseun", "Blessing",
  "Taiwo", "Kehinde", "Folake", "Rotimi", "Ifeoma", "Chiamaka", "Damilola",
];

const lastNames = [
  "Mensah", "Osei", "Diallo", "Traore", "Kamara", "Adekunle", "Okafor",
  "Nwosu", "Adeyemi", "Ibrahim", "Asante", "Owusu", "Boateng", "Abubakar",
  "Sow", "Coulibaly", "Keita", "Bah", "Sesay", "Conteh", "Jallo", "Ceesay",
  "Darboe", "Njie", "Sanneh", "Touray", "Fatty", "Jallow", "Ndow", "Gomez",
];

const nationalities = ["Gambian", "Senegalese", "Nigerian", "Ghanaian", "Sierra Leonean", "Guinean", "Malian"];
const currencies = ["GMD", "USD", "GBP", "EUR"];

const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const jacketSizes = ["XS", "S", "M", "L", "XL", "XXL"];

interface EmployeeInput {
  tenantId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: string;
  nationality: string;
  nationalIdNumber: string;
  personalEmail: string;
  personalPhone: string;
  homeAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  jobTitle: string;
  department: string;
  unit: string;
  employmentType: string;
  startDate: Date;
  probationEndDate?: Date;
  status: string;
  managerId?: string;
  basicSalary: number;
  currency: string;
  payFrequency: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  hasMedicalAid: boolean;
  medicalAidProvider?: string;
  medicalAidPlan?: string;
  hasPension: boolean;
  pensionContribution?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  shirtSize: string;
  trouserSize: string;
  shoeSize: string;
  jacketSize: string;
  notes?: string;
}

async function main() {
  // Find the owner tenant
  const owner = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!owner) {
    console.error("No owner business found. Run the main seed first.");
    process.exit(1);
  }

  console.log(`Seeding employees for tenant: ${owner.name} (${owner.id})`);

  // Clear existing employees
  await prisma.employeeDocument.deleteMany({ where: { employee: { tenantId: owner.id } } });
  await prisma.employee.deleteMany({ where: { tenantId: owner.id } });

  const employeeData: EmployeeInput[] = [];
  const banks = ["Trust Bank Gambia", "Ecobank", "GTBank", "BSIC Gambia", "Access Bank", "First International Bank"];
  let counter = 1;

  // Build a diverse set of employees across departments
  const departmentList = Object.keys(jobTitles);

  for (const dept of departmentList) {
    const deptUnits = units[dept as keyof typeof units];
    const deptTitles = jobTitles[dept];
    const count = dept === "Executive" ? 3 : dept === "Legal" ? 3 : 4;

    for (let i = 0; i < count; i++) {
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames);
      const gender = Math.random() > 0.45 ? "male" : "female";
      const title = deptTitles[i % deptTitles.length];
      const unit = deptUnits[i % deptUnits.length];
      const startMonthsAgo = Math.floor(Math.random() * 48) + 3;
      const startDate = monthsAgo(startMonthsAgo);
      const salary = dept === "Executive"
        ? Math.round((8000 + Math.random() * 7000) * 100) / 100
        : dept === "Engineering" || dept === "Finance"
        ? Math.round((3500 + Math.random() * 3500) * 100) / 100
        : Math.round((1800 + Math.random() * 2500) * 100) / 100;

      const currency = randomFrom(currencies);
      const bank = randomFrom(banks);
      const hasMedical = Math.random() > 0.3;
      const hasPension = Math.random() > 0.4;

      employeeData.push({
        tenantId: owner.id,
        employeeNumber: `EMP-${pad(counter++)}`,
        firstName,
        lastName,
        middleName: Math.random() > 0.5 ? randomFrom(firstNames) : undefined,
        dateOfBirth: yearsAgo(Math.floor(22 + Math.random() * 22)),
        gender,
        nationality: randomFrom(nationalities),
        nationalIdNumber: `GM${Math.floor(100000 + Math.random() * 900000)}`,
        personalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        personalPhone: `+220 ${Math.floor(300 + Math.random() * 600)} ${Math.floor(1000 + Math.random() * 9000)}`,
        homeAddress: `${Math.floor(1 + Math.random() * 99)} ${randomFrom(["Pipeline Road", "Kairaba Avenue", "Bertil Harding Highway", "Sait Matty Road", "Brusubi Turntable", "Westfield Junction", "Old Yundum Road"])}, ${randomFrom(["Banjul", "Serekunda", "Bakau", "Fajara", "Kololi", "Brikama", "Lamin"])}`,
        emergencyContactName: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
        emergencyContactPhone: `+220 ${Math.floor(300 + Math.random() * 600)} ${Math.floor(1000 + Math.random() * 9000)}`,
        emergencyContactRelationship: randomFrom(["Spouse", "Parent", "Sibling", "Friend"]),
        jobTitle: title,
        department: dept,
        unit,
        employmentType: i === 0 ? "full_time" : randomFrom(["full_time", "full_time", "full_time", "contract", "part_time"]),
        startDate,
        probationEndDate: startMonthsAgo > 3 ? undefined : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.1 ? "active" : randomFrom(["on_leave", "suspended"]),
        basicSalary: salary,
        currency,
        payFrequency: "monthly",
        bankName: bank,
        bankAccountName: `${firstName} ${lastName}`,
        bankAccountNumber: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        hasMedicalAid: hasMedical,
        medicalAidProvider: hasMedical ? randomFrom(["NHIA", "Bupa Africa", "Liberty Health", "Jubilee Insurance"]) : undefined,
        medicalAidPlan: hasMedical ? randomFrom(["Basic", "Standard", "Premium", "Family"]) : undefined,
        hasPension: hasPension,
        pensionContribution: hasPension ? Math.round((3 + Math.random() * 7) * 100) / 100 : undefined,
        housingAllowance: Math.random() > 0.4 ? Math.round((200 + Math.random() * 500) * 100) / 100 : undefined,
        transportAllowance: Math.random() > 0.3 ? Math.round((50 + Math.random() * 200) * 100) / 100 : undefined,
        shirtSize: randomFrom(shirtSizes),
        trouserSize: `${Math.floor(28 + Math.random() * 12)}-${Math.floor(28 + Math.random() * 8)}`,
        shoeSize: String(Math.floor(36 + Math.random() * 12)),
        jacketSize: randomFrom(jacketSizes),
      });
    }
  }

  // Insert employees in order, then assign managers
  const created: { id: string; department: string; employeeNumber: string }[] = [];

  for (const emp of employeeData) {
    const record = await prisma.employee.create({ data: emp });
    created.push({ id: record.id, department: emp.department, employeeNumber: emp.employeeNumber });
  }

  // Assign managers: first person in each dept manages the rest
  for (const dept of departmentList) {
    const deptEmployees = created.filter((e) => e.department === dept);
    if (deptEmployees.length < 2) continue;
    const manager = deptEmployees[0];
    for (const emp of deptEmployees.slice(1)) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { managerId: manager.id },
      });
    }
  }

  const total = await prisma.employee.count({ where: { tenantId: owner.id } });
  console.log(`✓ Seeded ${total} employees across ${departmentList.length} departments`);
  console.log(`  Employee numbers: EMP-0001 → EMP-${pad(total)}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
