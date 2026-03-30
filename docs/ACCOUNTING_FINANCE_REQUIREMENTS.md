# Accounting & Finance Module — Standards-Based Requirements

> Source: AccountingCoach notes (33 topics), cross-referenced against current platform state.
> Last updated: 2026-03-29

---

## The Core Problem with the Current Architecture

The platform currently records **transactions as data records** (Invoice, Bill, Expense, PayrollRun) but does **not post double-entry journal entries to a general ledger**. This means:

- You cannot generate a legally correct Balance Sheet or P&L from the accounting engine
- There is no proof that debits = credits at any point in time
- The Finance module currently plans to just aggregate raw data, which is not proper accounting

**Every accounting system — QuickBooks, Xero, SAP, or custom — is fundamentally a double-entry general ledger.** Everything else is built on top of it.

---

## What is Currently Correct

| What's built | Standard met |
|---|---|
| Invoice lifecycle (draft → sent → paid → void) | ✅ Revenue recognition timing is correct (accrual) |
| Credit notes | ✅ Correct reversal mechanism |
| Proforma invoices | ✅ Not yet revenue — correct |
| Bills / vendor management | ✅ Correct AP recording concept |
| Procurement three-way match (PO → GoodsReceipt → Bill) | ✅ Textbook AP controls |
| Tax profiles on invoices | ✅ Correct placement |
| Payroll gross/deductions/net | ✅ Correct payroll structure |
| Expense tracking | ✅ Correct expense recording concept |

**However** — none of these currently post to a GL. They are transactional records only.

---

## Phase 1: Chart of Accounts — The Foundation (must be built first)

Every account in the system must have a code, type, and normal balance. Without this, nothing else can work.

### Standard Account Numbering (international convention)

```
1000–1999  Assets
  1000  Cash
  1010  Petty Cash
  1100  Accounts Receivable
  1110  Allowance for Doubtful Accounts     (contra-asset, credit balance)
  1200  Inventory
  1300  Prepaid Expenses
  1400  Short-term Investments
  1500  Property, Plant & Equipment
  1510  Accumulated Depreciation — PP&E     (contra-asset, credit balance)
  1600  Intangible Assets
  1610  Accumulated Amortisation            (contra-asset, credit balance)
  1700  Loans Receivable (staff/owner)

2000–2999  Liabilities
  2000  Accounts Payable
  2100  Wages Payable
  2200  PAYE / Tax Payable
  2300  Unearned Revenue
  2400  Short-term Loans Payable
  2500  Credit Card Payable
  2600  Long-term Loans Payable
  2700  Bonds Payable

3000–3999  Equity
  3000  Owner's Capital / Share Capital
  3100  Retained Earnings
  3200  Drawings / Dividends Paid
  3300  Accumulated Other Comprehensive Income

4000–4999  Revenue
  4000  Service Revenue
  4100  Product / Sales Revenue
  4200  Interest Income
  4300  Rental Income
  4400  Gain on Asset Disposal
  4500  Other Income

5000–5999  Cost of Sales
  5000  Cost of Goods Sold
  5100  Direct Labour
  5200  Direct Materials

6000–6999  Operating Expenses
  6000  Salaries & Wages Expense
  6100  Rent Expense
  6200  Utilities Expense
  6300  Marketing & Advertising
  6400  Travel & Entertainment
  6500  Depreciation Expense
  6600  Bad Debts Expense
  6700  Insurance Expense
  6800  Professional Fees
  6900  General & Administrative

7000–7999  Non-Operating
  7000  Interest Expense
  7100  Loss on Asset Disposal
  7200  Foreign Exchange Loss / Gain
  7300  Income Tax Expense
```

### Business Rules

- Account codes are unique per tenant
- Each account has a normal balance determined by its type:
  - **Debit normal:** Assets, Expenses, Losses, Drawings (DEAL)
  - **Credit normal:** Liabilities, Revenue, Gains, Equity (GIRLS)
  - **Contra-accounts** carry the opposite balance to their parent (e.g. Allowance for Doubtful Accounts is credit; Accumulated Depreciation is credit)
- Sub-accounts share parent's code prefix (e.g. 6310 is a sub-account under 6300)
- Accounts cannot be deleted once they have posted transactions — only deactivated
- System ships with the pre-seeded chart above; tenants can add custom accounts and rename defaults
- Account type cannot be changed after creation

---

## Phase 2: Double-Entry Journal Entries

Every transaction must silently generate journal entries. Users never see this unless they navigate to the GL or Journal view.

### Auto-Journal Entry Map

| Transaction | Debit | Credit |
|---|---|---|
| Invoice created (accrual) | 1100 Accounts Receivable | 4000 Service Revenue |
| Invoice payment received | 1000 Cash | 1100 Accounts Receivable |
| Credit note issued | 4000 Service Revenue | 1100 Accounts Receivable |
| Bill/vendor invoice recorded | 6xxx Expense Account | 2000 Accounts Payable |
| Bill payment made | 2000 Accounts Payable | 1000 Cash |
| Expense paid in cash | 6xxx Expense Account | 1000 Cash |
| Expense on credit card | 6xxx Expense Account | 2500 Credit Card Payable |
| Payroll — gross wages | 6000 Salaries Expense | 2100 Wages Payable |
| Payroll — tax withholding | 2100 Wages Payable | 2200 PAYE Payable |
| Payroll — net payment | 2100 Wages Payable | 1000 Cash |
| Asset purchased (cash) | 1500 PP&E | 1000 Cash |
| Asset purchased (loan) | 1500 PP&E | 2600 Long-term Loans Payable |
| Depreciation posted | 6500 Depreciation Expense | 1510 Accumulated Depreciation |
| Loan disbursed to staff | 1700 Loans Receivable | 1000 Cash |
| Loan repayment received | 1000 Cash | 1700 Loans Receivable |
| Asset disposal (gain) | 1000 Cash + 1510 Accum. Depr. | 1500 PP&E + 4400 Gain on Disposal |
| Asset disposal (loss) | 1000 Cash + 1510 Accum. Depr. + 7100 Loss | 1500 PP&E |
| Bad debt write-off | 1110 Allowance for DA | 1100 Accounts Receivable |
| Bad debt recovery | 1100 Accounts Receivable | 1110 Allowance for DA |
| Recovered payment | 1000 Cash | 1100 Accounts Receivable |

### Journal Entry Business Rules

- Journal entries are **immutable once posted** — errors are corrected via reversing entries, not editing
- Every entry stores: date, description, source type (system/manual), source reference ID, debit account, credit account, debit amount, credit amount, posted by, posted at
- **Total debits must equal total credits per entry** — enforced at application layer before insert
- Auto-entries tagged `source = "system"`; manual entries tagged `source = "manual"`
- Manual journal entries require a description and approval for entries above a configurable threshold

---

## Phase 3: General Ledger & Trial Balance

### General Ledger

The GL is the running balance for each account, derived by summing all journal entries.

Business rules:
- Balances are **calculated dynamically** from journal entries — no stored running balance (prevents drift)
- Each account shows: opening balance, chronological debit/credit entries, running balance
- Filter by: date range, account, source type, reference
- Export to CSV

### Trial Balance

A two-column report listing every account with a non-zero balance at a given date.

Business rules:
- Total debit column **must equal** total credit column — any mismatch is a data integrity error
- Three versions:
  - **Unadjusted** — before period-end adjusting entries
  - **Adjusted** — after adjusting entries
  - **Post-closing** — after closing entries (only permanent Balance Sheet accounts remain)

---

## Phase 4: Accounting Periods

Business rules:
- Periods are monthly within a configurable fiscal year (fiscal year start date is a tenant setting)
- Period states: `open` → `closed` → `locked`
- **Open:** transactions can be posted freely
- **Closed:** no new transactions; reversals require manager override
- **Locked:** no changes whatsoever (year-end audit lock)
- System auto-creates the next period when the current one closes
- All transaction forms display and default to the current open period

---

## Phase 5: Adjusting Entries

Four types, posted as manual journal entries at period end:

| Type | Example | Debit | Credit |
|---|---|---|---|
| Accrued expense | Wages earned, not yet paid | 6000 Wages Expense | 2100 Wages Payable |
| Accrued revenue | Services delivered, not yet invoiced | 1100 Accounts Receivable | 4000 Service Revenue |
| Deferred expense (prepaid) | Monthly insurance allocation | 6700 Insurance Expense | 1300 Prepaid Insurance |
| Deferred revenue | Customer paid in advance | 2300 Unearned Revenue | 4000 Service Revenue |

Business rules:
- Only allowed in open periods
- **Reversing entries:** optional mirror-image entry auto-posted to first day of next period (simplifies accrual tracking)
- Adjusting entry templates: save and reuse monthly recurring adjustments

---

## Phase 6: Financial Statements

All four statements are generated directly from the General Ledger. They are read-only — no manual editing. PDF export required for all.

### Income Statement (P&L)

```
Revenue
  [4xxx accounts]                              xxx
  Total Revenue                                      xxx

Cost of Sales
  [5xxx accounts]                              xxx
  Total COGS                                         xxx

Gross Profit                                         xxx
Gross Profit Margin %                                xx%

Operating Expenses
  [6xxx accounts]                              xxx
  Total Operating Expenses                           xxx

Operating Income (EBIT)                              xxx
Operating Margin %                                   xx%

Non-Operating Items
  [7xxx accounts, net]                        (xxx)

Net Income Before Tax                                xxx
Income Tax Expense                                  (xxx)
Net Income                                           xxx
Net Profit Margin %                                  xx%
```

### Balance Sheet (at a point in time)

```
Assets
  Current Assets
    Cash                                       xxx
    Accounts Receivable                        xxx
    Less: Allowance for Doubtful Accounts     (xxx)
    Inventory                                  xxx
    Prepaid Expenses                           xxx
  Total Current Assets                               xxx

  Non-Current Assets
    Property, Plant & Equipment                xxx
    Less: Accumulated Depreciation            (xxx)
    Intangible Assets                          xxx
    Less: Accumulated Amortisation            (xxx)
    Loans Receivable (long-term)               xxx
  Total Non-Current Assets                           xxx

Total Assets                                         xxx

Liabilities
  Current Liabilities (due within 12 months)
    Accounts Payable                           xxx
    Wages Payable                              xxx
    PAYE / Tax Payable                         xxx
    Unearned Revenue                           xxx
    Short-term Loans Payable                   xxx
  Total Current Liabilities                          xxx

  Non-Current Liabilities
    Long-term Loans Payable                    xxx
    Bonds Payable                              xxx
  Total Non-Current Liabilities                      xxx

Total Liabilities                                    xxx

Equity
  Share Capital / Owner's Capital              xxx
  Retained Earnings (opening)                  xxx
  + Net Income (current period)                xxx
  - Drawings / Dividends                      (xxx)
  Total Equity                                       xxx

Total Liabilities + Equity                           xxx   ← must equal Total Assets
```

### Cash Flow Statement (indirect method)

```
Operating Activities
  Net Income                                   xxx
  Adjustments for non-cash items:
    + Depreciation & Amortisation              xxx
    + Bad Debts Expense                        xxx
  Changes in working capital:
    + Increase in Accounts Payable             xxx
    + Decrease in Accounts Receivable          xxx
    - Increase in Accounts Receivable         (xxx)
    - Increase in Inventory                   (xxx)
    - Decrease in Accounts Payable            (xxx)
  Net Cash from Operating Activities                xxx

Investing Activities
  Purchase of PP&E                            (xxx)
  Proceeds from Asset Disposal                 xxx
  Net Cash from Investing Activities                xxx

Financing Activities
  Loan proceeds received                       xxx
  Loan repayments made                        (xxx)
  Owner drawings / dividends paid             (xxx)
  Net Cash from Financing Activities                xxx

Net Change in Cash                                   xxx
Opening Cash Balance                                 xxx
Closing Cash Balance                                 xxx   ← must match 1000 Cash in GL
```

### Statement of Retained Earnings

```
Retained Earnings — Opening Balance                  xxx
+ Net Income for the Period                          xxx
- Dividends / Drawings                              (xxx)
Retained Earnings — Closing Balance                  xxx
```

---

## Phase 7: AR Enhancements — Allowance Method & Aging

The invoice module has an aging report but lacks the **allowance method**, which GAAP and IFRS require for bad debt estimation.

### Aging Buckets & Default Reserve Rates (configurable per tenant)

| Age | Default Reserve % |
|---|---|
| Current (0–30 days) | 1% |
| 31–60 days past due | 3% |
| 61–90 days past due | 10% |
| 91–180 days past due | 40% |
| 180+ days past due | 80% |

### Business Rules

- Period-end process: calculate required allowance balance → post adjusting entry
  - Debit: 6600 Bad Debts Expense
  - Credit: 1110 Allowance for Doubtful Accounts
- **Write-off** (when invoice confirmed uncollectible):
  - Debit: 1110 Allowance for Doubtful Accounts
  - Credit: 1100 Accounts Receivable
  - Does NOT affect the P&L — expense already recorded via allowance
- **Recovery** (customer pays after write-off):
  1. Reverse the write-off (Debit AR, Credit Allowance)
  2. Record payment (Debit Cash, Credit AR)
- Balance Sheet shows AR net of allowance: `Net Realisable Value = AR − Allowance`
- Direct write-off method (no allowance) is **not GAAP/IFRS compliant** — do not offer as default

---

## Phase 8: AP Enhancements — Aging & Early Payment Discounts

### AP Aging Buckets

| Age | Flag |
|---|---|
| Not yet due | — |
| 1–30 days overdue | Warning |
| 31–60 days overdue | Alert |
| 61–90 days overdue | Critical |
| 90+ days overdue | Escalate |

### Early Payment Discounts

Common terms: `2/10 n/30` (2% discount if paid within 10 days; full amount due in 30 days)

- System flags bills where the discount window is still open
- Annualised cost of missing a 2/10 n/30 discount ≈ **36%** — always worth taking if cash is available
- If discount taken:
  - Debit: 2000 Accounts Payable (full amount)
  - Credit: 1000 Cash (discounted amount)
  - Credit: 4500 Purchase Discounts Received (discount amount)
- Payment terms stored on the vendor record and defaulted onto each bill

---

## Phase 9: Bank Reconciliation

### Five-Step Process

1. Import or manually enter bank statement lines for the period
2. Auto-match bank lines to GL Cash entries (amount + date ± 3 days tolerance)
3. Identify and categorise unmatched items:
   - **Bank side:** deposits in transit (in books, not on statement), outstanding cheques (on statement, not yet in books)
   - **Books side:** bank fees, interest earned, NSF (bounced) cheques
4. Post adjusting journal entries for books-side items:
   - Bank fees: Debit 6900 General & Admin, Credit 1000 Cash
   - Interest earned: Debit 1000 Cash, Credit 4200 Interest Income
   - NSF cheque: Reverse original payment entry + post bank fee
5. Confirm: **Adjusted Bank Balance = Adjusted Book Balance**

### Business Rules

- One reconciliation per bank account per accounting period
- Once reconciled and locked, cannot be reopened without manager override and audit log entry
- Unreconciled items older than 90 days flagged for review
- Reconciliation statement exportable as PDF

---

## Phase 10: Fixed Assets & Depreciation

### Asset Register Fields

- Name, code, category (Equipment / Furniture / Vehicles / IT / Intangibles)
- Purchase date, purchase cost, vendor
- Useful life (years or units), salvage/residual value
- Depreciation method: Straight-Line | Double-Declining-Balance | Units of Activity
- Linked GL account (specific PP&E sub-account)
- Assigned to: employee, department, location
- Status: active | disposed | written-off

### Depreciation Methods

**Straight-Line (most common):**
```
Annual Depreciation = (Cost − Salvage Value) ÷ Useful Life in Years
Monthly            = Annual ÷ 12
```

**Double-Declining-Balance (accelerated):**
```
DDB Rate           = 2 ÷ Useful Life
Annual Depreciation = Book Value × DDB Rate
Note: Switch to SL in the year where SL gives a higher charge
Book Value         = Cost − Accumulated Depreciation
```

**Units of Activity:**
```
Per-Unit Rate      = (Cost − Salvage Value) ÷ Total Expected Units of Life
Period Depr.       = Units Used in Period × Per-Unit Rate
```

### Business Rules

- Cannot depreciate below salvage value
- Depreciation entries auto-posted monthly to the GL when the period is open
- **Partial-year depreciation:** pro-rated from the month of purchase
- Change in estimate (new useful life or salvage value): not retroactive; affects remaining life prospectively
- **Disposal entry:**
  - Remove asset cost (Credit PP&E)
  - Remove accumulated depreciation (Debit Accum. Depr.)
  - Record proceeds (Debit Cash)
  - Gain if proceeds > book value → Credit 4400 Gain on Disposal
  - Loss if proceeds < book value → Debit 7100 Loss on Disposal

---

## Phase 11: Inventory

**System type: Perpetual** (update continuously — correct for modern software)

### Cost Flow Methods

| Method | How it works | Recommended |
|---|---|---|
| **FIFO** (First In, First Out) | Oldest costs expensed first; newest costs remain in inventory | ✅ Default — matches physical flow; required under IFRS |
| **Weighted Average** | Average cost recalculated after each purchase; applied to all units | ✅ Acceptable under IFRS |
| **LIFO** (Last In, First Out) | Prohibited under IFRS (IAS 2) — US tax purposes only | ❌ Do not implement |

### Valuation Rule (IFRS IAS 2)

Inventory is measured at the **lower of cost or net realisable value (NRV)**:
```
NRV = Estimated Selling Price − Estimated Costs to Complete and Sell
```
If NRV < cost → write down to NRV:
- Debit: 5000 COGS (or a specific write-down expense)
- Credit: 1200 Inventory

### Business Rules

- Each goods receipt posts: Debit Inventory, Credit AP (or Cash)
- Each sale posts: Debit COGS, Credit Inventory (at cost)
- **Stocktake / physical count:** Record actual count; post adjustment for variance
  - Surplus: Debit Inventory, Credit COGS
  - Shortage: Debit COGS, Credit Inventory
- Inventory aging report: highlight items with zero movement in 90/180 days
- Gross profit method for estimation: `Estimated COGS = Net Sales × (1 − Gross Profit %)`

---

## Phase 12: Financial Ratios Dashboard

All ratios calculated automatically from the latest financial statements.

### Liquidity (can the business pay its short-term obligations?)

| Ratio | Formula | Healthy Target |
|---|---|---|
| Current Ratio | Current Assets ÷ Current Liabilities | ≥ 1.5 |
| Quick Ratio | (Current Assets − Inventory) ÷ Current Liabilities | ≥ 1.0 |
| Cash Ratio | Cash ÷ Current Liabilities | ≥ 0.5 |

### Profitability (how well is the business generating profit?)

| Ratio | Formula |
|---|---|
| Gross Profit Margin | Gross Profit ÷ Revenue × 100 |
| Operating Margin | Operating Income ÷ Revenue × 100 |
| Net Profit Margin | Net Income ÷ Revenue × 100 |
| Return on Assets (ROA) | Net Income ÷ Total Assets × 100 |
| Return on Equity (ROE) | Net Income ÷ Total Equity × 100 |

### Efficiency (how well is the business using its assets?)

| Ratio | Formula |
|---|---|
| AR Turnover | Revenue ÷ Average Accounts Receivable |
| Days Sales Outstanding (DSO) | 365 ÷ AR Turnover |
| AP Turnover | COGS ÷ Average Accounts Payable |
| Days Payable Outstanding (DPO) | 365 ÷ AP Turnover |
| Inventory Turnover | COGS ÷ Average Inventory |
| Days Inventory Outstanding (DIO) | 365 ÷ Inventory Turnover |
| Cash Conversion Cycle | DSO + DIO − DPO |

### Solvency (can the business meet its long-term obligations?)

| Ratio | Formula | Healthy Target |
|---|---|---|
| Debt-to-Equity | Total Debt ÷ Total Equity | < 2.0 |
| Debt Ratio | Total Debt ÷ Total Assets | < 0.5 |
| Interest Coverage | EBIT ÷ Interest Expense | ≥ 3.0 |

### Display rules
- Each ratio shows: current value, benchmark range, green/amber/red indicator
- 12-month trend sparkline
- Tooltip explaining what the ratio measures and how to interpret it

---

## Key Accounting Principles to Enforce in Code

| Principle | Implementation requirement |
|---|---|
| **Accrual basis** | Revenue recorded when earned (invoice created), not when cash received |
| **Matching principle** | COGS posted in same period as corresponding sale |
| **Revenue recognition** | Invoice date = recognition date for service businesses (ASC 606 / IFRS 15) |
| **Conservatism** | Inventory written down if NRV < cost; allowance for doubtful accounts estimated |
| **Going concern** | No special implementation, but financial health indicators inform this |
| **Economic entity** | Strict `tenantId` scoping on all records — owner's personal finances never mix with business |
| **Monetary unit** | All amounts stored as `Decimal(12,2)` in the database; currency stored per transaction |
| **Full disclosure** | Notes fields on journal entries; linked source transactions traceable |
| **Consistency** | Depreciation method and inventory cost flow method cannot be changed without documented reason |
| **Materiality** | Configurable thresholds for approval workflows |

---

## Build Order (dependency chain)

```
1. Chart of Accounts
   └── Must exist before any journal entries can be posted

2. Auto-journal entries for all existing transactions
   └── Invoices, bills, expenses, payroll, loans — all retroactively/prospectively

3. General Ledger view + Trial Balance
   └── Proves the double-entry engine is working correctly

4. Accounting Periods
   └── Enables closing, locking, and adjusting entry workflows

5. Adjusting Entries (manual journal entries)
   └── Required before financial statements are correct

6. Financial Statements (P&L, Balance Sheet, Cash Flow, Retained Earnings)
   └── Generated from GL; all four required together

7. AR Allowance for Doubtful Accounts
   └── Requires Chart of Accounts (1110 account)

8. AP Aging + Early Payment Discounts
   └── Extends existing bills module

9. Bank Reconciliation
   └── Requires GL Cash account to be running

10. Fixed Assets + Depreciation
    └── Requires 1500/1510/6500 accounts and auto-posting

11. Inventory (FIFO / Weighted Average)
    └── Requires 1200/5000 accounts and perpetual posting

12. Financial Ratios Dashboard
    └── Requires all financial statements to be complete
```

---

## What Does NOT Change (Already Correct)

- Invoice, bill, expense, payroll data models — these remain. They become the **source of truth** that triggers journal entries; they do not get replaced.
- Procurement three-way match flow — correct, just needs GL posting wired in.
- Payroll gross/deductions/net structure — correct.
- The Finance module should **read from the GL**, not aggregate raw transaction tables.
