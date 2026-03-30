import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}
function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Default Chart of Accounts ───────────────────────────────────────────────

const DEFAULT_ACCOUNTS = [
  // Assets
  { code: "1000", name: "Cash & Bank",                  type: "Asset",        normalBalance: "debit",  isSystem: true  },
  { code: "1010", name: "Petty Cash",                   type: "Asset",        normalBalance: "debit",  isSystem: false },
  { code: "1020", name: "Mobile Money",                 type: "Asset",        normalBalance: "debit",  isSystem: false },
  { code: "1100", name: "Accounts Receivable",          type: "Asset",        normalBalance: "debit",  isSystem: true  },
  { code: "1110", name: "Allowance for Doubtful Accts", type: "Asset",        normalBalance: "credit", isSystem: true,  isContra: true },
  { code: "1200", name: "Inventory",                    type: "Asset",        normalBalance: "debit",  isSystem: true  },
  { code: "1300", name: "Prepaid Expenses",             type: "Asset",        normalBalance: "debit",  isSystem: false },
  { code: "1310", name: "Prepaid Insurance",            type: "Asset",        normalBalance: "debit",  isSystem: false },
  { code: "1320", name: "Prepaid Rent",                 type: "Asset",        normalBalance: "debit",  isSystem: false },
  { code: "1500", name: "Property, Plant & Equipment",  type: "Asset",        normalBalance: "debit",  isSystem: true  },
  { code: "1510", name: "Accumulated Depreciation",     type: "Asset",        normalBalance: "credit", isSystem: true,  isContra: true },
  { code: "1600", name: "Intangible Assets",            type: "Asset",        normalBalance: "debit",  isSystem: false },
  { code: "1700", name: "Staff Loans Receivable",       type: "Asset",        normalBalance: "debit",  isSystem: true  },
  // Liabilities
  { code: "2000", name: "Accounts Payable",             type: "Liability",    normalBalance: "credit", isSystem: true  },
  { code: "2100", name: "Wages Payable",                type: "Liability",    normalBalance: "credit", isSystem: true  },
  { code: "2200", name: "Tax Payable (PAYE)",           type: "Liability",    normalBalance: "credit", isSystem: true  },
  { code: "2210", name: "VAT Payable",                  type: "Liability",    normalBalance: "credit", isSystem: false },
  { code: "2300", name: "Unearned Revenue",             type: "Liability",    normalBalance: "credit", isSystem: false },
  { code: "2400", name: "Short-term Loan Payable",      type: "Liability",    normalBalance: "credit", isSystem: false },
  { code: "2500", name: "Credit Card Payable",          type: "Liability",    normalBalance: "credit", isSystem: false },
  { code: "2600", name: "Long-term Loan Payable",       type: "Liability",    normalBalance: "credit", isSystem: false },
  // Equity
  { code: "3000", name: "Owner's Capital",              type: "Equity",       normalBalance: "credit", isSystem: true  },
  { code: "3100", name: "Retained Earnings",            type: "Equity",       normalBalance: "credit", isSystem: true  },
  { code: "3200", name: "Owner's Drawings",             type: "Equity",       normalBalance: "debit",  isSystem: false, isContra: true },
  { code: "3300", name: "Share Capital",                type: "Equity",       normalBalance: "credit", isSystem: false },
  // Revenue
  { code: "4000", name: "Service Revenue",              type: "Revenue",      normalBalance: "credit", isSystem: true  },
  { code: "4100", name: "Product Revenue",              type: "Revenue",      normalBalance: "credit", isSystem: false },
  { code: "4200", name: "Interest Income",              type: "Revenue",      normalBalance: "credit", isSystem: false },
  { code: "4300", name: "Rental Income",                type: "Revenue",      normalBalance: "credit", isSystem: false },
  { code: "4400", name: "Gain on Asset Disposal",       type: "NonOperating", normalBalance: "credit", isSystem: false },
  { code: "4500", name: "Other Income",                 type: "Revenue",      normalBalance: "credit", isSystem: false },
  // Cost of Sales
  { code: "5000", name: "Cost of Goods Sold",           type: "CostOfSales",  normalBalance: "debit",  isSystem: true  },
  { code: "5100", name: "Direct Labour",                type: "CostOfSales",  normalBalance: "debit",  isSystem: false },
  { code: "5200", name: "Direct Materials",             type: "CostOfSales",  normalBalance: "debit",  isSystem: false },
  // Expenses
  { code: "6000", name: "Salaries & Wages",             type: "Expense",      normalBalance: "debit",  isSystem: true  },
  { code: "6100", name: "Rent Expense",                 type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6110", name: "Utilities Expense",            type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6120", name: "Internet & Telecom",           type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6200", name: "General & Admin Expenses",     type: "Expense",      normalBalance: "debit",  isSystem: true  },
  { code: "6210", name: "Office Supplies",              type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6220", name: "Printing & Stationery",        type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6300", name: "Travel & Transport",           type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6310", name: "Fuel Expense",                 type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6400", name: "Marketing & Advertising",      type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6500", name: "Depreciation Expense",         type: "Expense",      normalBalance: "debit",  isSystem: true  },
  { code: "6600", name: "Insurance Expense",            type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6700", name: "Professional Fees",            type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6800", name: "Bank Charges",                 type: "Expense",      normalBalance: "debit",  isSystem: false },
  { code: "6900", name: "Miscellaneous Expense",        type: "Expense",      normalBalance: "debit",  isSystem: false },
  // Non-operating
  { code: "7000", name: "Interest Expense",             type: "NonOperating", normalBalance: "debit",  isSystem: false },
  { code: "7100", name: "Loss on Asset Disposal",       type: "NonOperating", normalBalance: "debit",  isSystem: false },
  { code: "7300", name: "Income Tax Expense",           type: "Expense",      normalBalance: "debit",  isSystem: false },
];

// ─── Journal entry templates for realistic transactions ──────────────────────

interface JETmpl {
  description: string;
  reference?: string;
  sourceType: string;
  lines: { code: string; side: "debit" | "credit" }[];
  amounts: number[];
}

const INVOICE_ENTRIES: JETmpl[] = [
  { description: "Invoice INV-0001 — Web Development Services", reference: "INV-0001", sourceType: "invoice",
    lines: [{ code: "1100", side: "debit" }, { code: "4000", side: "credit" }], amounts: [85000, 85000] },
  { description: "Invoice INV-0002 — Digital Marketing Retainer", reference: "INV-0002", sourceType: "invoice",
    lines: [{ code: "1100", side: "debit" }, { code: "4000", side: "credit" }], amounts: [45000, 45000] },
  { description: "Invoice INV-0003 — Mobile App Design", reference: "INV-0003", sourceType: "invoice",
    lines: [{ code: "1100", side: "debit" }, { code: "4000", side: "credit" }], amounts: [120000, 120000] },
  { description: "Invoice INV-0004 — IT Consulting — January", reference: "INV-0004", sourceType: "invoice",
    lines: [{ code: "1100", side: "debit" }, { code: "4000", side: "credit" }], amounts: [30000, 30000] },
  { description: "Invoice INV-0005 — Branding Package", reference: "INV-0005", sourceType: "invoice",
    lines: [{ code: "1100", side: "debit" }, { code: "4000", side: "credit" }], amounts: [65000, 65000] },
  { description: "Invoice INV-0006 — E-commerce Platform Build", reference: "INV-0006", sourceType: "invoice",
    lines: [{ code: "1100", side: "debit" }, { code: "4000", side: "credit" }], amounts: [200000, 200000] },
];

const PAYMENT_ENTRIES: JETmpl[] = [
  { description: "Payment received — INV-0001", reference: "INV-0001", sourceType: "invoice_payment",
    lines: [{ code: "1000", side: "debit" }, { code: "1100", side: "credit" }], amounts: [85000, 85000] },
  { description: "Payment received — INV-0002", reference: "INV-0002", sourceType: "invoice_payment",
    lines: [{ code: "1000", side: "debit" }, { code: "1100", side: "credit" }], amounts: [45000, 45000] },
  { description: "Payment received — INV-0003 (partial)", reference: "INV-0003", sourceType: "invoice_payment",
    lines: [{ code: "1000", side: "debit" }, { code: "1100", side: "credit" }], amounts: [60000, 60000] },
  { description: "Payment received — INV-0004", reference: "INV-0004", sourceType: "invoice_payment",
    lines: [{ code: "1000", side: "debit" }, { code: "1100", side: "credit" }], amounts: [30000, 30000] },
  { description: "Payment received — INV-0005", reference: "INV-0005", sourceType: "invoice_payment",
    lines: [{ code: "1000", side: "debit" }, { code: "1100", side: "credit" }], amounts: [65000, 65000] },
];

const BILL_ENTRIES: JETmpl[] = [
  { description: "Bill BILL-0001 — Office Rent March 2026", reference: "BILL-0001", sourceType: "bill",
    lines: [{ code: "6100", side: "debit" }, { code: "2000", side: "credit" }], amounts: [35000, 35000] },
  { description: "Bill BILL-0002 — Electricity — February 2026", reference: "BILL-0002", sourceType: "bill",
    lines: [{ code: "6110", side: "debit" }, { code: "2000", side: "credit" }], amounts: [8400, 8400] },
  { description: "Bill BILL-0003 — Internet & Telecom Services", reference: "BILL-0003", sourceType: "bill",
    lines: [{ code: "6120", side: "debit" }, { code: "2000", side: "credit" }], amounts: [4500, 4500] },
  { description: "Bill BILL-0004 — Office Supplies Q1 2026", reference: "BILL-0004", sourceType: "bill",
    lines: [{ code: "6210", side: "debit" }, { code: "2000", side: "credit" }], amounts: [9800, 9800] },
  { description: "Bill BILL-0005 — Generator Maintenance", reference: "BILL-0005", sourceType: "bill",
    lines: [{ code: "6200", side: "debit" }, { code: "2000", side: "credit" }], amounts: [35000, 35000] },
  { description: "Bill BILL-0006 — Professional Audit Fees", reference: "BILL-0006", sourceType: "bill",
    lines: [{ code: "6700", side: "debit" }, { code: "2000", side: "credit" }], amounts: [25000, 25000] },
  { description: "Bill BILL-0007 — Office Cleaning Services", reference: "BILL-0007", sourceType: "bill",
    lines: [{ code: "6200", side: "debit" }, { code: "2000", side: "credit" }], amounts: [6000, 6000] },
];

const BILL_PAYMENT_ENTRIES: JETmpl[] = [
  { description: "Payment — Bill BILL-0001 Rent", reference: "BILL-0001", sourceType: "bill_payment",
    lines: [{ code: "2000", side: "debit" }, { code: "1000", side: "credit" }], amounts: [35000, 35000] },
  { description: "Payment — Bill BILL-0002 Electricity", reference: "BILL-0002", sourceType: "bill_payment",
    lines: [{ code: "2000", side: "debit" }, { code: "1000", side: "credit" }], amounts: [8400, 8400] },
  { description: "Payment — Bill BILL-0003 Internet", reference: "BILL-0003", sourceType: "bill_payment",
    lines: [{ code: "2000", side: "debit" }, { code: "1000", side: "credit" }], amounts: [4500, 4500] },
  { description: "Payment — Bill BILL-0004 Supplies", reference: "BILL-0004", sourceType: "bill_payment",
    lines: [{ code: "2000", side: "debit" }, { code: "1000", side: "credit" }], amounts: [9800, 9800] },
  { description: "Payment — Bill BILL-0006 Audit Fees", reference: "BILL-0006", sourceType: "bill_payment",
    lines: [{ code: "2000", side: "debit" }, { code: "1000", side: "credit" }], amounts: [25000, 25000] },
];

const EXPENSE_ENTRIES: JETmpl[] = [
  { description: "Expense reimbursed — Staff travel to Banjul", sourceType: "expense",
    lines: [{ code: "6300", side: "debit" }, { code: "1000", side: "credit" }], amounts: [2500, 2500] },
  { description: "Expense reimbursed — Fuel for company vehicle", sourceType: "expense",
    lines: [{ code: "6310", side: "debit" }, { code: "1000", side: "credit" }], amounts: [3200, 3200] },
  { description: "Expense reimbursed — Client entertainment lunch", sourceType: "expense",
    lines: [{ code: "6200", side: "debit" }, { code: "1000", side: "credit" }], amounts: [4800, 4800] },
  { description: "Expense reimbursed — Printing & stationery", sourceType: "expense",
    lines: [{ code: "6220", side: "debit" }, { code: "1000", side: "credit" }], amounts: [1200, 1200] },
  { description: "Expense reimbursed — Bank charges February", sourceType: "expense",
    lines: [{ code: "6800", side: "debit" }, { code: "1000", side: "credit" }], amounts: [750, 750] },
  { description: "Expense reimbursed — Conference registration fee", sourceType: "expense",
    lines: [{ code: "6400", side: "debit" }, { code: "1000", side: "credit" }], amounts: [8000, 8000] },
  { description: "Expense reimbursed — Flight to Dakar — Business trip", sourceType: "expense",
    lines: [{ code: "6300", side: "debit" }, { code: "1000", side: "credit" }], amounts: [15000, 15000] },
  { description: "Expense reimbursed — Hotel accommodation — 3 nights", sourceType: "expense",
    lines: [{ code: "6300", side: "debit" }, { code: "1000", side: "credit" }], amounts: [9000, 9000] },
];

const PAYROLL_ENTRIES: JETmpl[] = [
  { description: "Payroll — January 2026", reference: "PAY-2026-01", sourceType: "payroll_run",
    lines: [{ code: "6000", side: "debit" }, { code: "2100", side: "credit" }], amounts: [285000, 285000] },
  { description: "Payroll — February 2026", reference: "PAY-2026-02", sourceType: "payroll_run",
    lines: [{ code: "6000", side: "debit" }, { code: "2100", side: "credit" }], amounts: [291500, 291500] },
  { description: "Payroll — March 2026", reference: "PAY-2026-03", sourceType: "payroll_run",
    lines: [{ code: "6000", side: "debit" }, { code: "2100", side: "credit" }], amounts: [298000, 298000] },
  { description: "Payroll paid — January 2026", reference: "PAY-2026-01", sourceType: "payroll_payment",
    lines: [{ code: "2100", side: "debit" }, { code: "1000", side: "credit" }], amounts: [285000, 285000] },
  { description: "Payroll paid — February 2026", reference: "PAY-2026-02", sourceType: "payroll_payment",
    lines: [{ code: "2100", side: "debit" }, { code: "1000", side: "credit" }], amounts: [291500, 291500] },
];

const LOAN_ENTRIES: JETmpl[] = [
  { description: "Loan disbursed — LN-0001 (Lamin Jallow)", reference: "LN-0001", sourceType: "loan",
    lines: [{ code: "1700", side: "debit" }, { code: "1000", side: "credit" }], amounts: [25000, 25000] },
  { description: "Loan disbursed — LN-0002 (Fatoumata Ceesay)", reference: "LN-0002", sourceType: "loan",
    lines: [{ code: "1700", side: "debit" }, { code: "1000", side: "credit" }], amounts: [15000, 15000] },
  { description: "Loan disbursed — LN-0003 (Omar Touray)", reference: "LN-0003", sourceType: "loan",
    lines: [{ code: "1700", side: "debit" }, { code: "1000", side: "credit" }], amounts: [40000, 40000] },
  { description: "Loan repayment — LN-0001 (instalment 1)", reference: "LN-0001", sourceType: "loan_repayment",
    lines: [{ code: "1000", side: "debit" }, { code: "1700", side: "credit" }], amounts: [5000, 5000] },
  { description: "Loan repayment — LN-0001 (instalment 2)", reference: "LN-0001", sourceType: "loan_repayment",
    lines: [{ code: "1000", side: "debit" }, { code: "1700", side: "credit" }], amounts: [5000, 5000] },
  { description: "Loan repayment — LN-0002 (instalment 1)", reference: "LN-0002", sourceType: "loan_repayment",
    lines: [{ code: "1000", side: "debit" }, { code: "1700", side: "credit" }], amounts: [3000, 3000] },
  { description: "Loan repayment — LN-0003 (instalment 1)", reference: "LN-0003", sourceType: "loan_repayment",
    lines: [{ code: "1000", side: "debit" }, { code: "1700", side: "credit" }], amounts: [8000, 8000] },
];

const ASSET_ENTRIES: JETmpl[] = [
  { description: "Asset purchased — Dell Laptop (AST-0001)", reference: "PO-0001", sourceType: "manual",
    lines: [{ code: "1500", side: "debit" }, { code: "1000", side: "credit" }], amounts: [45000, 45000] },
  { description: "Asset purchased — Office Desk Set (AST-0002)", reference: "PO-0002", sourceType: "manual",
    lines: [{ code: "1500", side: "debit" }, { code: "2000", side: "credit" }], amounts: [18000, 18000] },
  { description: "Asset purchased — HP Printer (AST-0003)", reference: "PO-0003", sourceType: "manual",
    lines: [{ code: "1500", side: "debit" }, { code: "1000", side: "credit" }], amounts: [22000, 22000] },
  { description: "Depreciation — Q1 2026 (Laptops)", reference: "DEP-Q1-2026", sourceType: "manual",
    lines: [{ code: "6500", side: "debit" }, { code: "1510", side: "credit" }], amounts: [3750, 3750] },
  { description: "Depreciation — Q1 2026 (Furniture)", reference: "DEP-Q1-2026", sourceType: "manual",
    lines: [{ code: "6500", side: "debit" }, { code: "1510", side: "credit" }], amounts: [900, 900] },
  { description: "Depreciation — Q1 2026 (Printers)", reference: "DEP-Q1-2026", sourceType: "manual",
    lines: [{ code: "6500", side: "debit" }, { code: "1510", side: "credit" }], amounts: [1833, 1833] },
];

const EQUITY_ENTRIES: JETmpl[] = [
  { description: "Owner capital contribution — January 2026", reference: "CAP-2026-01", sourceType: "manual",
    lines: [{ code: "1000", side: "debit" }, { code: "3000", side: "credit" }], amounts: [500000, 500000] },
  { description: "Owner drawings — February 2026", reference: "DRAW-2026-02", sourceType: "manual",
    lines: [{ code: "3200", side: "debit" }, { code: "1000", side: "credit" }], amounts: [50000, 50000] },
  { description: "Insurance premium paid — annual policy", reference: "INS-2026", sourceType: "manual",
    lines: [{ code: "6600", side: "debit" }, { code: "1000", side: "credit" }], amounts: [18000, 18000] },
  { description: "Bank charges — Q1 2026", reference: "BANK-Q1", sourceType: "manual",
    lines: [{ code: "6800", side: "debit" }, { code: "1000", side: "credit" }], amounts: [2250, 2250] },
  { description: "Miscellaneous income — equipment hire", reference: "MISC-001", sourceType: "manual",
    lines: [{ code: "1000", side: "debit" }, { code: "4500", side: "credit" }], amounts: [5000, 5000] },
  { description: "Prepaid rent — Q2 2026", reference: "PREP-RENT", sourceType: "manual",
    lines: [{ code: "1320", side: "debit" }, { code: "1000", side: "credit" }], amounts: [105000, 105000] },
];

const ALL_ENTRY_TEMPLATES = [
  ...INVOICE_ENTRIES,
  ...PAYMENT_ENTRIES,
  ...BILL_ENTRIES,
  ...BILL_PAYMENT_ENTRIES,
  ...EXPENSE_ENTRIES,
  ...PAYROLL_ENTRIES,
  ...LOAN_ENTRIES,
  ...ASSET_ENTRIES,
  ...EQUITY_ENTRIES,
];

// ─── Budget data ──────────────────────────────────────────────────────────────

const BUDGET_TEMPLATES = [
  {
    name: "FY 2025 Annual Budget",
    description: "Full-year operating budget for financial year 2025",
    startDate: d(2025, 1, 1), endDate: d(2025, 12, 31),
    status: "approved",
    lines: [
      { label: "Salaries & Wages",      lineType: "category", reference: "6000", allocatedAmount: 3200000 },
      { label: "Office Rent",           lineType: "category", reference: "6100", allocatedAmount:  420000 },
      { label: "Utilities",             lineType: "category", reference: "6110", allocatedAmount:  100000 },
      { label: "Internet & Telecom",    lineType: "category", reference: "6120", allocatedAmount:   54000 },
      { label: "Office Supplies",       lineType: "category", reference: "6210", allocatedAmount:   60000 },
      { label: "Travel & Transport",    lineType: "category", reference: "6300", allocatedAmount:  180000 },
      { label: "Marketing",             lineType: "category", reference: "6400", allocatedAmount:  240000 },
      { label: "Professional Fees",     lineType: "category", reference: "6700", allocatedAmount:  120000 },
      { label: "Insurance",             lineType: "category", reference: "6600", allocatedAmount:   36000 },
      { label: "Depreciation",          lineType: "category", reference: "6500", allocatedAmount:   80000 },
      { label: "Bank Charges",          lineType: "category", reference: "6800", allocatedAmount:   18000 },
      { label: "Miscellaneous",         lineType: "category", reference: "6900", allocatedAmount:   60000 },
    ],
  },
  {
    name: "Q1 2026 Operating Budget",
    description: "January – March 2026 quarterly operating budget",
    startDate: d(2026, 1, 1), endDate: d(2026, 3, 31),
    status: "approved",
    lines: [
      { label: "Salaries & Wages",      lineType: "category", reference: "6000", allocatedAmount:  900000 },
      { label: "Office Rent",           lineType: "category", reference: "6100", allocatedAmount:  105000 },
      { label: "Utilities",             lineType: "category", reference: "6110", allocatedAmount:   25000 },
      { label: "Internet & Telecom",    lineType: "category", reference: "6120", allocatedAmount:   13500 },
      { label: "Office Supplies",       lineType: "category", reference: "6210", allocatedAmount:   15000 },
      { label: "Travel & Transport",    lineType: "category", reference: "6300", allocatedAmount:   45000 },
      { label: "Marketing",             lineType: "category", reference: "6400", allocatedAmount:   60000 },
      { label: "Professional Fees",     lineType: "category", reference: "6700", allocatedAmount:   30000 },
      { label: "Bank Charges",          lineType: "category", reference: "6800", allocatedAmount:    4500 },
      { label: "Miscellaneous",         lineType: "category", reference: "6900", allocatedAmount:   15000 },
    ],
  },
  {
    name: "Technology Department — 2026",
    description: "Technology team budget covering hardware, software, and training",
    startDate: d(2026, 1, 1), endDate: d(2026, 12, 31),
    status: "approved",
    lines: [
      { label: "IT Equipment",          lineType: "department", reference: "Technology", allocatedAmount: 250000 },
      { label: "Software Licences",     lineType: "department", reference: "Technology", allocatedAmount:  90000 },
      { label: "Cloud Infrastructure",  lineType: "department", reference: "Technology", allocatedAmount: 120000 },
      { label: "Training & Development",lineType: "department", reference: "Technology", allocatedAmount:  60000 },
      { label: "Internet & Bandwidth",  lineType: "department", reference: "Technology", allocatedAmount:  30000 },
      { label: "IT Support Contracts",  lineType: "department", reference: "Technology", allocatedAmount:  45000 },
    ],
  },
  {
    name: "Marketing Campaign — H1 2026",
    description: "First-half 2026 marketing and outreach budget",
    startDate: d(2026, 1, 1), endDate: d(2026, 6, 30),
    status: "submitted",
    lines: [
      { label: "Social Media Ads",      lineType: "category", reference: "6400", allocatedAmount:  80000 },
      { label: "Google Ads",            lineType: "category", reference: "6400", allocatedAmount:  60000 },
      { label: "Events & Sponsorships", lineType: "category", reference: "6400", allocatedAmount:  50000 },
      { label: "Content Creation",      lineType: "category", reference: "6400", allocatedAmount:  40000 },
      { label: "Influencer Campaigns",  lineType: "category", reference: "6400", allocatedAmount:  30000 },
      { label: "Print & OOH",           lineType: "category", reference: "6400", allocatedAmount:  20000 },
    ],
  },
  {
    name: "HR Department — 2026",
    description: "Human resources annual spend including recruitment, training and welfare",
    startDate: d(2026, 1, 1), endDate: d(2026, 12, 31),
    status: "approved",
    lines: [
      { label: "Recruitment Costs",     lineType: "department", reference: "HR", allocatedAmount:  80000 },
      { label: "Training & Development",lineType: "department", reference: "HR", allocatedAmount: 120000 },
      { label: "Staff Welfare",         lineType: "department", reference: "HR", allocatedAmount:  60000 },
      { label: "Performance Bonuses",   lineType: "department", reference: "HR", allocatedAmount: 200000 },
      { label: "HR Software",           lineType: "department", reference: "HR", allocatedAmount:  36000 },
      { label: "Medical Cover",         lineType: "department", reference: "HR", allocatedAmount:  90000 },
    ],
  },
  {
    name: "Q2 2026 Operating Budget",
    description: "April – June 2026 quarterly operating budget (draft)",
    startDate: d(2026, 4, 1), endDate: d(2026, 6, 30),
    status: "draft",
    lines: [
      { label: "Salaries & Wages",      lineType: "category", reference: "6000", allocatedAmount:  920000 },
      { label: "Office Rent",           lineType: "category", reference: "6100", allocatedAmount:  105000 },
      { label: "Utilities",             lineType: "category", reference: "6110", allocatedAmount:   26000 },
      { label: "Internet & Telecom",    lineType: "category", reference: "6120", allocatedAmount:   13500 },
      { label: "Office Supplies",       lineType: "category", reference: "6210", allocatedAmount:   14000 },
      { label: "Travel & Transport",    lineType: "category", reference: "6300", allocatedAmount:   48000 },
      { label: "Marketing",             lineType: "category", reference: "6400", allocatedAmount:   65000 },
      { label: "Miscellaneous",         lineType: "category", reference: "6900", allocatedAmount:   18000 },
    ],
  },
];

// ─── Periods ──────────────────────────────────────────────────────────────────

const PERIODS = [
  { name: "January 2025",   startDate: d(2025, 1, 1),  endDate: d(2025, 1, 31),  fiscalYear: 2025, status: "locked" },
  { name: "February 2025",  startDate: d(2025, 2, 1),  endDate: d(2025, 2, 28),  fiscalYear: 2025, status: "locked" },
  { name: "March 2025",     startDate: d(2025, 3, 1),  endDate: d(2025, 3, 31),  fiscalYear: 2025, status: "locked" },
  { name: "April 2025",     startDate: d(2025, 4, 1),  endDate: d(2025, 4, 30),  fiscalYear: 2025, status: "locked" },
  { name: "May 2025",       startDate: d(2025, 5, 1),  endDate: d(2025, 5, 31),  fiscalYear: 2025, status: "locked" },
  { name: "June 2025",      startDate: d(2025, 6, 1),  endDate: d(2025, 6, 30),  fiscalYear: 2025, status: "locked" },
  { name: "July 2025",      startDate: d(2025, 7, 1),  endDate: d(2025, 7, 31),  fiscalYear: 2025, status: "locked" },
  { name: "August 2025",    startDate: d(2025, 8, 1),  endDate: d(2025, 8, 31),  fiscalYear: 2025, status: "locked" },
  { name: "September 2025", startDate: d(2025, 9, 1),  endDate: d(2025, 9, 30),  fiscalYear: 2025, status: "locked" },
  { name: "October 2025",   startDate: d(2025, 10, 1), endDate: d(2025, 10, 31), fiscalYear: 2025, status: "locked" },
  { name: "November 2025",  startDate: d(2025, 11, 1), endDate: d(2025, 11, 30), fiscalYear: 2025, status: "locked" },
  { name: "December 2025",  startDate: d(2025, 12, 1), endDate: d(2025, 12, 31), fiscalYear: 2025, status: "closed" },
  { name: "January 2026",   startDate: d(2026, 1, 1),  endDate: d(2026, 1, 31),  fiscalYear: 2026, status: "closed" },
  { name: "February 2026",  startDate: d(2026, 2, 1),  endDate: d(2026, 2, 28),  fiscalYear: 2026, status: "closed" },
  { name: "March 2026",     startDate: d(2026, 3, 1),  endDate: d(2026, 3, 31),  fiscalYear: 2026, status: "open"   },
  { name: "April 2026",     startDate: d(2026, 4, 1),  endDate: d(2026, 4, 30),  fiscalYear: 2026, status: "open"   },
];

// Spread entries across periods based on month
const PERIOD_ENTRY_MAP: Record<string, JETmpl[]> = {
  "January 2026":  [...PAYROLL_ENTRIES.slice(0, 2), ...INVOICE_ENTRIES.slice(0, 2), ...LOAN_ENTRIES.slice(0, 2), ...EQUITY_ENTRIES.slice(0, 3)],
  "February 2026": [...BILL_ENTRIES.slice(0, 4), ...EXPENSE_ENTRIES.slice(0, 4), ...PAYMENT_ENTRIES.slice(0, 2), ...PAYROLL_ENTRIES.slice(2, 4)],
  "March 2026":    [...INVOICE_ENTRIES.slice(2, 6), ...PAYMENT_ENTRIES.slice(2, 5), ...BILL_ENTRIES.slice(4, 7),
                   ...BILL_PAYMENT_ENTRIES, ...EXPENSE_ENTRIES.slice(4, 8), ...LOAN_ENTRIES.slice(2, 7),
                   ...ASSET_ENTRIES, ...PAYROLL_ENTRIES.slice(4, 6), ...EQUITY_ENTRIES.slice(3, 6)],
};

// Representative dates within each period
const PERIOD_DATES: Record<string, Date[]> = {
  "January 2026":  [d(2026, 1, 5), d(2026, 1, 10), d(2026, 1, 15), d(2026, 1, 20), d(2026, 1, 25), d(2026, 1, 31)],
  "February 2026": [d(2026, 2, 3), d(2026, 2, 8),  d(2026, 2, 14), d(2026, 2, 18), d(2026, 2, 22), d(2026, 2, 28)],
  "March 2026":    [d(2026, 3, 2), d(2026, 3, 5),  d(2026, 3, 10), d(2026, 3, 14), d(2026, 3, 18), d(2026, 3, 22), d(2026, 3, 25), d(2026, 3, 29)],
};

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isOwnerBusiness: true } });
  if (!tenant) {
    console.error("❌  No owner business found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`✔  Tenant: ${tenant.name} (${tenant.id})`);

  // ── 1. Chart of Accounts ────────────────────────────────────────────────────
  console.log("→  Seeding Chart of Accounts...");
  const accountMap: Record<string, string> = {};

  for (const acc of DEFAULT_ACCOUNTS) {
    const existing = await prisma.ledgerAccount.findFirst({
      where: { tenantId: tenant.id, code: acc.code },
    });
    if (existing) {
      accountMap[acc.code] = existing.id;
      continue;
    }
    const created = await prisma.ledgerAccount.create({
      data: {
        tenantId:      tenant.id,
        code:          acc.code,
        name:          acc.name,
        type:          acc.type,
        normalBalance: acc.normalBalance,
        isContra:      (acc as { isContra?: boolean }).isContra ?? false,
        isSystem:      acc.isSystem,
        isActive:      true,
      },
    });
    accountMap[acc.code] = created.id;
  }
  console.log(`   ${Object.keys(accountMap).length} accounts ready`);

  // ── 2. Accounting Periods ───────────────────────────────────────────────────
  console.log("→  Seeding Accounting Periods...");
  const periodMap: Record<string, string> = {};

  for (const p of PERIODS) {
    const existing = await prisma.accountingPeriod.findFirst({
      where: { tenantId: tenant.id, name: p.name },
    });
    if (existing) {
      periodMap[p.name] = existing.id;
      continue;
    }
    const created = await prisma.accountingPeriod.create({
      data: { tenantId: tenant.id, ...p },
    });
    periodMap[p.name] = created.id;
  }
  console.log(`   ${Object.keys(periodMap).length} periods ready`);

  // ── 3. Journal Entries ──────────────────────────────────────────────────────
  console.log("→  Seeding Journal Entries...");
  let totalEntries = 0;

  for (const [periodName, templates] of Object.entries(PERIOD_ENTRY_MAP)) {
    const periodId = periodMap[periodName];
    if (!periodId) continue;

    const dates = PERIOD_DATES[periodName] ?? [d(2026, 3, 15)];

    for (let i = 0; i < templates.length; i++) {
      const tmpl = templates[i];
      const entryDate = dates[i % dates.length];

      // Validate all account codes exist
      const missingCode = tmpl.lines.find((l) => !accountMap[l.code]);
      if (missingCode) {
        console.warn(`   ⚠ Skipping "${tmpl.description}" — missing account ${missingCode.code}`);
        continue;
      }

      // Check if already seeded (by description + periodId)
      const existing = await prisma.journalEntry.findFirst({
        where: { tenantId: tenant.id, periodId, description: tmpl.description },
      });
      if (existing) continue;

      await prisma.journalEntry.create({
        data: {
          tenantId:    tenant.id,
          periodId,
          date:        entryDate,
          description: tmpl.description,
          reference:   tmpl.reference ?? null,
          sourceType:  tmpl.sourceType,
          lines: {
            create: tmpl.lines.map((l, idx) => ({
              accountId:   accountMap[l.code],
              debit:       l.side === "debit"  ? tmpl.amounts[idx] : 0,
              credit:      l.side === "credit" ? tmpl.amounts[idx] : 0,
              description: tmpl.description,
            })),
          },
        },
      });
      totalEntries++;
    }
  }
  console.log(`   ${totalEntries} journal entries created`);

  // ── 4. Budgets ──────────────────────────────────────────────────────────────
  console.log("→  Seeding Budgets...");
  let totalBudgets = 0;

  for (const b of BUDGET_TEMPLATES) {
    const existing = await prisma.budget.findFirst({
      where: { tenantId: tenant.id, name: b.name },
    });
    if (existing) { console.log(`   skip: ${b.name}`); continue; }

    await prisma.budget.create({
      data: {
        tenantId:    tenant.id,
        name:        b.name,
        description: b.description,
        startDate:   b.startDate,
        endDate:     b.endDate,
        currency:    "GMD",
        status:      b.status,
        lines: {
          create: b.lines.map((l) => ({
            tenantId:        tenant.id,
            label:           l.label,
            lineType:        l.lineType,
            reference:       l.reference,
            allocatedAmount: l.allocatedAmount,
          })),
        },
      },
    });
    totalBudgets++;
  }
  console.log(`   ${totalBudgets} budgets created`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.ledgerAccount.count({ where: { tenantId: tenant.id } }),
    prisma.accountingPeriod.count({ where: { tenantId: tenant.id } }),
    prisma.journalEntry.count({ where: { tenantId: tenant.id } }),
    prisma.journalEntryLine.count({ where: { journalEntry: { tenantId: tenant.id } } }),
    prisma.budget.count({ where: { tenantId: tenant.id } }),
    prisma.budgetLine.count({ where: { tenantId: tenant.id } }),
  ]);

  console.log("\n✅  Accounting seed complete:");
  console.log(`   LedgerAccount:    ${counts[0]}`);
  console.log(`   AccountingPeriod: ${counts[1]}`);
  console.log(`   JournalEntry:     ${counts[2]}`);
  console.log(`   JournalEntryLine: ${counts[3]}`);
  console.log(`   Budget:           ${counts[4]}`);
  console.log(`   BudgetLine:       ${counts[5]}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
