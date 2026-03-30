# Accounting Engine — Implementation Plan

> Phase-by-phase plan for building a standards-compliant double-entry accounting engine.
> Reference: `docs/ACCOUNTING_FINANCE_REQUIREMENTS.md`
> Standards: IFRS (primary), GAAP (reference)

---

## The Problem

The platform currently records transactions as data records (Invoice, Bill, Expense, PayrollRun) but does not post double-entry journal entries to a general ledger. This means financial statements cannot be generated correctly. Every accounting system is fundamentally a double-entry GL — everything else is built on top of it.

---

## Dependency Chain

```
Phase 1: Schema Foundation
  AccountingPeriod + Account + JournalEntry + JournalEntryLine
  └── Pre-seeded default Chart of Accounts

Phase 2: CoA UI
  Account list, add/edit, account detail view

Phase 3: Auto-journal entries
  Hook every existing transaction to post JournalEntry + lines
  (Invoices, Payments, Bills, Expenses, Payroll, Loans)

Phase 4: General Ledger + Trial Balance UI
  Proves debits = credits; validates Phase 3

Phase 5: Accounting Periods
  Open/close/lock periods; fiscal year config

Phase 6: Adjusting Entries
  Manual journal entries; reversing entries; templates

Phase 7: Financial Statements
  P&L, Balance Sheet, Cash Flow, Retained Earnings — all from GL

Phase 8: AR Allowance for Doubtful Accounts
Phase 9: AP Aging + Early Payment Discounts
Phase 10: Bank Reconciliation
Phase 11: Fixed Assets + Depreciation (auto-posts to GL)
Phase 12: Inventory (FIFO / Weighted Average, perpetual)
Phase 13: Financial Ratios Dashboard
```

---

## Phase 1: Schema Foundation

### New Prisma Models

```prisma
model AccountingPeriod {
  id          String   @id @default(cuid())
  tenantId    String
  name        String           // e.g. "March 2026"
  startDate   DateTime
  endDate     DateTime
  fiscalYear  Int
  status      String   @default("open")  // open | closed | locked
  createdAt   DateTime @default(now())

  tenant         Tenant           @relation(...)
  journalEntries JournalEntry[]

  @@index([tenantId, status])
  @@index([tenantId, fiscalYear])
}

model Account {
  id             String   @id @default(cuid())
  tenantId       String
  code           String           // e.g. "1100"
  name           String           // e.g. "Accounts Receivable"
  type           String           // Asset | Liability | Equity | Revenue | CostOfSales | Expense | NonOperating
  normalBalance  String           // debit | credit
  isContra       Boolean  @default(false)
  parentId       String?
  isActive       Boolean  @default(true)
  isSystem       Boolean  @default(false)  // true = pre-seeded, cannot delete
  description    String?
  createdAt      DateTime @default(now())

  tenant   Tenant    @relation(...)
  parent   Account?  @relation("AccountHierarchy", fields: [parentId], references: [id])
  children Account[] @relation("AccountHierarchy")
  journalEntryLines JournalEntryLine[]

  @@unique([tenantId, code])
  @@index([tenantId, type])
  @@index([tenantId, isActive])
}

model JournalEntry {
  id          String   @id @default(cuid())
  tenantId    String
  periodId    String
  date        DateTime
  description String
  reference   String?          // human-readable ref e.g. "INV-0042"
  sourceType  String           // invoice | payment | bill | expense | payroll | loan | asset | manual | adjusting
  sourceId    String?          // FK to source record (null for manual)
  isReversing Boolean  @default(false)
  reversesId  String?          // points to original entry this reverses
  postedById  String?
  createdAt   DateTime @default(now())

  tenant  Tenant             @relation(...)
  period  AccountingPeriod   @relation(...)
  lines   JournalEntryLine[]

  @@index([tenantId, date])
  @@index([tenantId, sourceType, sourceId])
  @@index([periodId])
}

model JournalEntryLine {
  id             String  @id @default(cuid())
  journalEntryId String
  accountId      String
  debit          Decimal @default(0) @db.Decimal(12, 2)
  credit         Decimal @default(0) @db.Decimal(12, 2)
  description    String?

  journalEntry JournalEntry @relation(...)
  account      Account      @relation(...)

  @@index([journalEntryId])
  @@index([accountId])
}
```

### Pre-seeded Default Chart of Accounts

Seeded via migration or seed script. All marked `isSystem = true`.

| Code | Name | Type | Normal Balance | Contra |
|------|------|------|----------------|--------|
| 1000 | Cash | Asset | Debit | No |
| 1010 | Petty Cash | Asset | Debit | No |
| 1100 | Accounts Receivable | Asset | Debit | No |
| 1110 | Allowance for Doubtful Accounts | Asset | Credit | Yes |
| 1200 | Inventory | Asset | Debit | No |
| 1300 | Prepaid Expenses | Asset | Debit | No |
| 1500 | Property, Plant & Equipment | Asset | Debit | No |
| 1510 | Accumulated Depreciation | Asset | Credit | Yes |
| 1600 | Intangible Assets | Asset | Debit | No |
| 1700 | Loans Receivable | Asset | Debit | No |
| 2000 | Accounts Payable | Liability | Credit | No |
| 2100 | Wages Payable | Liability | Credit | No |
| 2200 | PAYE / Tax Payable | Liability | Credit | No |
| 2300 | Unearned Revenue | Liability | Credit | No |
| 2400 | Short-term Loans Payable | Liability | Credit | No |
| 2500 | Credit Card Payable | Liability | Credit | No |
| 2600 | Long-term Loans Payable | Liability | Credit | No |
| 3000 | Owner's Capital / Share Capital | Equity | Credit | No |
| 3100 | Retained Earnings | Equity | Credit | No |
| 3200 | Drawings / Dividends Paid | Equity | Debit | No |
| 4000 | Service Revenue | Revenue | Credit | No |
| 4100 | Product / Sales Revenue | Revenue | Credit | No |
| 4200 | Interest Income | Revenue | Credit | No |
| 4300 | Rental Income | Revenue | Credit | No |
| 4400 | Gain on Asset Disposal | NonOperating | Credit | No |
| 4500 | Purchase Discounts Received | Revenue | Credit | No |
| 5000 | Cost of Goods Sold | CostOfSales | Debit | No |
| 5100 | Direct Labour | CostOfSales | Debit | No |
| 6000 | Salaries & Wages Expense | Expense | Debit | No |
| 6100 | Rent Expense | Expense | Debit | No |
| 6200 | Utilities Expense | Expense | Debit | No |
| 6300 | Marketing & Advertising | Expense | Debit | No |
| 6400 | Travel & Entertainment | Expense | Debit | No |
| 6500 | Depreciation Expense | Expense | Debit | No |
| 6600 | Bad Debts Expense | Expense | Debit | No |
| 6700 | Insurance Expense | Expense | Debit | No |
| 6800 | Professional Fees | Expense | Debit | No |
| 6900 | General & Administrative | Expense | Debit | No |
| 7000 | Interest Expense | NonOperating | Debit | No |
| 7100 | Loss on Asset Disposal | NonOperating | Debit | No |
| 7200 | Foreign Exchange Loss | NonOperating | Debit | No |
| 7300 | Income Tax Expense | NonOperating | Debit | No |

---

## Phase 3: Auto-Journal Entry Map

Every transaction type fires a `postJournalEntry()` server action. Called within the same DB transaction as the source record mutation.

| Trigger | Debit | Credit |
|---------|-------|--------|
| Invoice created | 1100 AR | 4000 Service Revenue |
| Invoice payment received | 1000 Cash | 1100 AR |
| Credit note issued | 4000 Service Revenue | 1100 AR |
| Bill recorded | 6xxx Expense (by category) | 2000 AP |
| Bill payment made | 2000 AP | 1000 Cash |
| Expense (cash) | 6xxx Expense | 1000 Cash |
| Expense (card) | 6xxx Expense | 2500 Credit Card Payable |
| Payroll — gross wages | 6000 Salaries Expense | 2100 Wages Payable |
| Payroll — PAYE withholding | 2100 Wages Payable | 2200 PAYE Payable |
| Payroll — net payment | 2100 Wages Payable | 1000 Cash |
| Loan disbursed | 1700 Loans Receivable | 1000 Cash |
| Loan repayment received | 1000 Cash | 1700 Loans Receivable |
| Asset purchased (cash) | 1500 PP&E | 1000 Cash |
| Asset purchased (loan) | 1500 PP&E | 2600 Long-term Loans Payable |
| Monthly depreciation | 6500 Depreciation Expense | 1510 Accumulated Depreciation |
| Asset disposal (gain) | 1000 Cash + 1510 Accum. Depr. | 1500 PP&E + 4400 Gain |
| Asset disposal (loss) | 1000 Cash + 1510 Accum. Depr. + 7100 Loss | 1500 PP&E |
| Inventory receipt | 1200 Inventory | 2000 AP |
| Sale / COGS | 5000 COGS | 1200 Inventory |
| Bad debt write-off | 1110 Allowance | 1100 AR |
| Bad debt recovery — step 1 | 1100 AR | 1110 Allowance |
| Bad debt recovery — step 2 | 1000 Cash | 1100 AR |
| Bank fee | 6900 G&A | 1000 Cash |
| Interest earned (bank) | 1000 Cash | 4200 Interest Income |
| NSF cheque reversal | 1100 AR | 1000 Cash |

---

## Phase 7: Financial Statements — Calculation Logic

### Income Statement
- Revenue = sum of credit balances on 4xxx accounts for period
- COGS = sum of debit balances on 5xxx accounts for period
- Gross Profit = Revenue − COGS
- Operating Expenses = sum of debit balances on 6xxx accounts for period
- Operating Income (EBIT) = Gross Profit − Operating Expenses
- Non-operating net = 4200/4300/4400 credits − 7xxx debits
- Net Income = Operating Income + Non-operating net − 7300 Tax Expense

### Balance Sheet
- Current Assets: 1000–1399 net balances (1110 subtracted from 1100; 1510 subtracted from 1500)
- Non-Current Assets: 1400–1799 net balances
- Current Liabilities: 2000–2399 balances
- Non-Current Liabilities: 2400–2699 balances
- Equity: 3000 + 3100 + prior retained earnings + current net income − 3200
- Validation: Total Assets = Total Liabilities + Total Equity

### Cash Flow (indirect)
- Start: Net Income
- Add back: Depreciation (6500), Bad Debts Expense (6600)
- Working capital changes: Δ AR, Δ Inventory, Δ Prepaid, Δ AP, Δ Wages Payable, Δ Unearned Revenue
- Investing: movements on 1500, 1600 accounts
- Financing: movements on 2400, 2600, 3200 accounts
- Closing cash: must equal GL balance on 1000 Cash

---

## Routes to Build (Accounting module)

```
/africs/accounting/chart-of-accounts          list + add
/africs/accounting/chart-of-accounts/[id]     detail + edit
/africs/accounting/journal-entries            list (filterable)
/africs/accounting/journal-entries/new        manual entry form
/africs/accounting/general-ledger             per-account view
/africs/accounting/trial-balance              unadjusted / adjusted / post-closing tabs
/africs/accounting/periods                    period management
/africs/finance/statements/pl                 P&L
/africs/finance/statements/balance-sheet      Balance Sheet
/africs/finance/statements/cash-flow          Cash Flow
/africs/finance/statements/retained-earnings  Retained Earnings
/africs/finance/ratios                        Financial Ratios Dashboard
```

---

## Key Implementation Rules

1. Journal entries are **immutable** — no UPDATE or DELETE on JournalEntry/JournalEntryLine; correct with reversing entries
2. `debit + credit` validation: before inserting any JournalEntry, assert `sum(lines.debit) === sum(lines.credit)`
3. All auto-journal entries are posted **inside the same Prisma transaction** as the source mutation — if the entry fails, the whole transaction rolls back
4. Account balances are **always calculated dynamically** from JournalEntryLine aggregation — never stored as a running balance
5. `isSystem = true` accounts cannot be deleted — only deactivated (and even deactivation is blocked if they have posted entries)
6. Every tenant gets their own copy of the seeded chart on first setup (or on-demand via a "initialise accounting" action)
