# HR & Accounting — Completion Roadmap

_Last updated: 2026-03-23_

This document tracks the remaining work needed to complete the HR and Accounting & Finance modules.

---

## Current State (as of 2026-03-23)

### HR — Done
- Employee profiles (personal, contact, employment, compensation, benefits, sizes)
- Employee status tracking (active, on_leave with leave type, suspended, terminated, resigned)
- Staff ID card and Business card (front + back, HTML + PDF)
- Employee profile PDF export
- Leave Management (balances, requests, approve/reject, bulk allocate)
- TIN, citizenship, searchable country dropdowns

### Accounting — Done
- Invoicing (full lifecycle: draft → sent → viewed → paid/overdue/void)
- Proforma invoices (draft → sent → accepted → converted/expired)
- Invoice PDF generation and email
- Payments recording and history
- Recurring invoices
- Invoice settings (prefix, numbering, tax, bank details, branding)

---

## Priority Order

### 1. 🔴 Payroll — NEXT
**Why first:** Highest impact. Uses salary, allowances, deductions, and bank details already captured on every employee. Bridges HR and Finance. Produces payslips and feeds the salary expense journal.

**Scope:**
- Payroll run model (period, status: draft → processed → paid)
- Payslip per employee per run (gross, deductions, net, bank details)
- Earnings: basic salary + housing + transport + other allowances + overtime (future)
- Deductions: PAYE tax, pension contribution, medical aid contribution, other
- Payslip PDF (printable A4 — company header, employee details, earnings/deductions breakdown, net pay, bank details)
- Pages: `/africs/accounting/payroll` (run list), `/africs/accounting/payroll/new` (create run), `/africs/accounting/payroll/[id]` (run detail + payslip list)

---

### 2. 🔴 Expenses
**Why second:** Everyday use. Employees submit expense claims; managers approve; finance reimburses. Self-contained, high frequency.

**Scope:**
- Expense model (amount, category, date, receipt upload, status: draft → submitted → approved/rejected → reimbursed)
- Expense categories (travel, meals, accommodation, office supplies, etc.)
- Approval workflow
- Reimbursement recording
- Pages: `/africs/accounting/expenses` (list + approve), `/africs/accounting/expenses/new`

---

### 3. 🟡 HR Dashboard
**Why:** Low build effort — all the data is already in the system. Gives an instant snapshot of the workforce.

**Scope:**
- Headcount by department and status
- On-leave today count
- Upcoming leave (next 7 days)
- Recent hire activity
- Leave balance utilization summary
- Employee type breakdown (full-time / part-time / contract / intern)
- Page: `/africs/hr/dashboard`

---

### 4. 🟡 Accounting Dashboard
**Why:** Uses invoicing and payroll data already in the system. Financial overview for the owner.

**Scope:**
- Revenue this month / YTD (from paid invoices)
- Outstanding AR (sent/overdue invoices total)
- Payroll cost this month
- Expense spend this month
- Aging AR buckets (0–30, 31–60, 61–90, 90+ days)
- Recent transactions list
- Page: `/africs/accounting/dashboard`

---

### 5. 🟡 Bills & Vendors
**Why:** Completes the accounts payable side. Currently only have AR (invoices issued). Need AP (bills received).

**Scope:**
- Vendor model (name, contact, address, payment terms, bank details)
- Bill model (vendor, amount, due date, status: draft → approved → paid → overdue)
- Bill payments recording
- Pages: `/africs/accounting/vendors`, `/africs/accounting/bills`

---

### 6. 🟠 Timesheets
**Why:** Daily attendance and hours tracking. Feeds into payroll (overtime) and HR dashboard.

**Scope:**
- Attendance/timesheet model (employee, date, clock-in, clock-out, hours, notes)
- Weekly timesheet view
- Manager approval
- Pages: `/africs/hr/timesheets`

---

### 7. 🟠 Overtime
**Why:** Depends on timesheets. Tracks overtime hours and pay, feeds into payroll.

**Scope:**
- Overtime request model (employee, date, hours, rate multiplier, status)
- Link overtime entries to payroll run (add to earnings)
- Page: `/africs/hr/overtime`

---

### 8. 🟠 Receipts
**Why:** Auto-generate receipts from paid invoices. Relatively low effort.

**Scope:**
- Receipt model (linked to invoice payment)
- Receipt PDF (simpler than invoice PDF — confirms payment received)
- Page: `/africs/accounting/receipts`

---

### 9. 🟢 Appraisals
**Why:** Performance management. Useful but not day-to-day operational.

**Scope:**
- Appraisal cycle model (period, status)
- Review model (employee, reviewer, ratings, comments, goals)
- Page: `/africs/hr/appraisals`

---

### 10. 🟢 Recruitment
**Why:** Hiring pipeline. Lower priority until the business is actively hiring.

**Scope:**
- Job posting model
- Applicant pipeline (stages: applied → screening → interview → offer → hired/rejected)
- Page: `/africs/hr/recruitment`

---

### 11. 🟢 Finance (General Ledger)
**Why:** Full double-entry bookkeeping. Complex to implement correctly. Can be phased in after payroll/expenses are generating journal entries automatically.

**Scope:**
- Chart of accounts
- Journal entries (auto-generated from payroll, invoices, expenses)
- Trial balance, P&L, Balance Sheet reports

---

## Summary Table

| # | Feature | Module | Priority | Status |
|---|---------|--------|----------|--------|
| 1 | Payroll | HR + Accounting | 🔴 Critical | ✅ Done |
| 2 | Expenses | Accounting | 🔴 Critical | ✅ Done |
| 3 | HR Dashboard | HR | 🟡 High | Not started |
| 4 | Accounting Dashboard | Accounting | 🟡 High | Not started |
| 5 | Bills & Vendors | Accounting | 🟡 High | Not started |
| 6 | Timesheets | HR | 🟠 Medium | Not started |
| 7 | Overtime | HR | 🟠 Medium | Not started |
| 8 | Receipts | Accounting | 🟠 Medium | Not started |
| 9 | Appraisals | HR | 🟢 Lower | Not started |
| 10 | Recruitment | HR | 🟢 Lower | Not started |
| 11 | Finance (GL) | Accounting | 🟢 Lower | Not started |
