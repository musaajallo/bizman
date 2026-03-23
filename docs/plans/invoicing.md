# AfricsCore — Invoicing Module Plan

## Context

AfricsCore needs an invoicing module so the owner (Africs) can bill clients for project work. Invoices are tied to projects, which already have billing metadata (`billingType`, `budgetAmount`, `budgetCurrency`, `hourlyRate`) and time tracking (`TimeEntry` model). The sidebar already has an "Invoices" link wired to `/africs/accounting/invoices` with a stub page.

The module should support:
- Creating invoices from project data (auto-populate from time entries for hourly projects, or fixed amounts)
- Flexible line items (auto-generated + manual additions)
- Multiple currencies (project's `budgetCurrency`)
- Invoice numbering with customizable prefix
- PDF generation with client branding (logo, colors, watermark from Tenant model)
- Invoice lifecycle: Draft → Sent → Viewed → Paid / Overdue / Void
- Payment tracking (partial and full payments)
- Recurring invoices for retainer projects
- Client-facing invoice view (public shareable link, no auth required)
- Email delivery
- Dashboard with outstanding/overdue/paid totals

---

## Data Model

### New Models (add to `prisma/schema.prisma`)

**InvoiceSettings** — per-tenant invoice configuration:

```prisma
model InvoiceSettings {
  id              String  @id @default(cuid())
  tenantId        String  @unique
  prefix          String  @default("INV")
  nextNumber      Int     @default(1)
  defaultDueDays  Int     @default(30)
  defaultNotes    String? @db.Text
  defaultTerms    String? @db.Text
  bankName        String?
  bankAccountName String?
  bankAccountNumber String?
  bankRoutingNumber String?
  bankSwift       String?
  bankIban        String?
  taxLabel        String? @default("Tax")
  defaultTaxRate  Decimal? @db.Decimal(5, 2)

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

**Invoice** — the core invoice entity:

```prisma
model Invoice {
  id              String    @id @default(cuid())
  tenantId        String
  projectId       String?
  clientTenantId  String?

  // Numbering
  invoiceNumber   String
  referenceNumber String?

  // Status lifecycle: draft → sent → viewed → paid / overdue / void
  status          String    @default("draft")

  // Dates
  issueDate       DateTime  @default(now())
  dueDate         DateTime
  paidDate        DateTime?
  sentAt          DateTime?
  viewedAt        DateTime?
  voidedAt        DateTime?

  // Client info (snapshot at invoice creation time, not live reference)
  clientName      String
  clientEmail     String?
  clientPhone     String?
  clientAddress   String?

  // Amounts (calculated from line items)
  subtotal        Decimal   @db.Decimal(12, 2) @default(0)
  taxRate         Decimal?  @db.Decimal(5, 2)
  taxAmount       Decimal   @db.Decimal(12, 2) @default(0)
  discountAmount  Decimal   @db.Decimal(12, 2) @default(0)
  total           Decimal   @db.Decimal(12, 2) @default(0)
  amountPaid      Decimal   @db.Decimal(12, 2) @default(0)
  amountDue       Decimal   @db.Decimal(12, 2) @default(0)
  currency        String    @default("USD")

  // Content
  notes           String?   @db.Text
  terms           String?   @db.Text

  // Sharing
  shareToken      String    @unique @default(cuid())

  // PDF
  pdfUrl          String?

  // Recurring
  isRecurring     Boolean   @default(false)
  recurringInterval String? // weekly, biweekly, monthly, quarterly
  nextRecurringDate DateTime?
  parentInvoiceId String?

  // Metadata
  createdById     String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant       Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project      Project?        @relation(fields: [projectId], references: [id], onDelete: SetNull)
  clientTenant Tenant?         @relation("InvoiceClient", fields: [clientTenantId], references: [id], onDelete: SetNull)
  parentInvoice Invoice?       @relation("RecurringInvoices", fields: [parentInvoiceId], references: [id], onDelete: SetNull)
  recurringChildren Invoice[]  @relation("RecurringInvoices")
  createdBy    User            @relation(fields: [createdById], references: [id])
  lineItems    InvoiceLineItem[]
  payments     InvoicePayment[]
  activities   InvoiceActivity[]

  @@unique([tenantId, invoiceNumber])
  @@index([tenantId, status])
  @@index([projectId])
  @@index([clientTenantId])
  @@index([dueDate])
  @@index([shareToken])
}
```

**InvoiceLineItem** — individual billable items:

```prisma
model InvoiceLineItem {
  id          String  @id @default(cuid())
  invoiceId   String
  order       Int     @default(0)

  description String
  quantity    Decimal @db.Decimal(10, 2)
  unitPrice   Decimal @db.Decimal(12, 2)
  amount      Decimal @db.Decimal(12, 2)
  unit        String? // hours, days, units, fixed

  // Link to time entries (for hourly billing — which entries this line covers)
  timeEntryIds String[]

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId, order])
}
```

**InvoicePayment** — track partial and full payments:

```prisma
model InvoicePayment {
  id          String   @id @default(cuid())
  invoiceId   String
  amount      Decimal  @db.Decimal(12, 2)
  method      String?  // bank_transfer, cash, check, card, mobile_money, other
  reference   String?
  notes       String?
  date        DateTime @default(now())
  recordedById String
  createdAt   DateTime @default(now())

  invoice    Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  recordedBy User    @relation(fields: [recordedById], references: [id])

  @@index([invoiceId])
}
```

**InvoiceActivity** — audit trail for invoice lifecycle events:

```prisma
model InvoiceActivity {
  id        String   @id @default(cuid())
  invoiceId String
  actorId   String?
  action    String   // created, updated, sent, viewed, paid, partially_paid, voided, reminder_sent
  details   Json?
  createdAt DateTime @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  actor   User?   @relation(fields: [actorId], references: [id])

  @@index([invoiceId, createdAt])
}
```

### Relations to add on existing models

**Tenant** — add:
```prisma
invoiceSettings   InvoiceSettings?
invoices          Invoice[]
clientInvoices    Invoice[]         @relation("InvoiceClient")
```

**User** — add:
```prisma
createdInvoices   Invoice[]
invoicePayments   InvoicePayment[]
invoiceActivities InvoiceActivity[]
```

**Project** — add:
```prisma
invoices Invoice[]
```

### Modules update

Add `"invoicing"` to the default `enabledModules` array, or leave it opt-in.

---

## Implementation Phases

### Phase 1: Core Invoice CRUD + Line Items

**Goal**: Create, edit, and manage invoices with line items. Generate invoices from project billing data. Invoice list with filtering.

**Schema:**
- Add `InvoiceSettings`, `Invoice`, `InvoiceLineItem` models + relations
- Run migration

**Server Actions** (`src/lib/actions/invoices.ts`):
- `getInvoiceSettings(tenantId)` — fetch or create default settings
- `updateInvoiceSettings(tenantId, formData)` — update prefix, due days, bank details, tax
- `getInvoices(tenantId, filters?)` — list with status/project/client/date filters
- `getInvoice(invoiceId)` — single invoice with line items, project, client
- `getInvoicesForProject(projectId)` — scoped to a project
- `getInvoicesForClient(clientTenantId)` — scoped to a client
- `createInvoice(formData)` — create with auto-numbering (prefix + next number)
- `createInvoiceFromProject(projectId, options)` — auto-generate line items:
  - If `billingType === "hourly"`: aggregate uninvoiced time entries by user, create lines with hours x rate
  - If `billingType === "fixed"`: create single line with budget amount
  - If `billingType === "retainer"`: create line with retainer amount
  - Snapshot client info (name, email, address) at creation time
- `updateInvoice(invoiceId, formData)` — only if status is "draft"
- `addLineItem(invoiceId, data)` — add manual line item
- `updateLineItem(lineItemId, data)` — edit line item
- `deleteLineItem(lineItemId)` — remove line item
- `recalculateInvoiceTotals(invoiceId)` — sum line items, apply tax/discount, update amounts
- `deleteInvoice(invoiceId)` — only if status is "draft"
- `duplicateInvoice(invoiceId)` — clone as new draft

**Server Actions** (`src/lib/actions/invoice-settings.ts`):
- Settings CRUD separated for cleanliness

**Components** (`src/components/invoices/`):
- `invoice-form.tsx` — create/edit form: client selector, project selector, dates, line items editor, notes, terms
- `line-item-editor.tsx` — table-style line item editor: description, quantity, unit price, amount (auto-calculated), add/remove rows, drag to reorder
- `invoice-card.tsx` — summary card for list view: number, client, total, status badge, due date
- `invoice-status-badge.tsx` — colored badge per status (draft=gray, sent=blue, viewed=amber, paid=green, overdue=red, void=strikethrough)
- `invoice-summary.tsx` — subtotal, tax, discount, total display block
- `project-invoice-button.tsx` — "Generate Invoice" button for project detail pages

**Pages:**
- `src/app/(platform)/africs/accounting/invoices/page.tsx` — replace stub with full invoice list
- `src/app/(platform)/africs/accounting/invoices/new/page.tsx` — create invoice form
- `src/app/(platform)/africs/accounting/invoices/[id]/page.tsx` — invoice detail/edit view
- `src/app/(platform)/africs/accounting/invoices/settings/page.tsx` — invoice settings (numbering, bank, tax)
- Add "Generate Invoice" action to project detail and project settings pages
- `src/app/(platform)/clients/[slug]/invoices/page.tsx` — client-scoped invoice list (read-only)

### Phase 2: Invoice Lifecycle + Payments

**Goal**: Send invoices, track status changes, record payments, handle overdue detection.

**Schema:**
- Add `InvoicePayment`, `InvoiceActivity` models + relations
- Run migration

**Server Actions** (`src/lib/actions/invoices.ts` additions):
- `sendInvoice(invoiceId)` — set status to "sent", set `sentAt`, create activity, create notification
- `markInvoiceViewed(invoiceId)` — set `viewedAt` (called from public view page)
- `recordPayment(invoiceId, amount, method, reference, notes)` — create payment, update `amountPaid`/`amountDue`, if fully paid set status to "paid" + `paidDate`
- `deletePayment(paymentId)` — remove payment, recalculate amounts, revert status if needed
- `voidInvoice(invoiceId)` — set status to "void", set `voidedAt`
- `getInvoiceActivities(invoiceId)` — activity timeline
- `sendReminder(invoiceId)` — re-send with "reminder" flag
- `checkOverdueInvoices(tenantId)` — batch: find sent invoices past due date, update status to "overdue"

**Components:**
- `invoice-actions.tsx` — action dropdown: Send, Record Payment, Send Reminder, Void, Duplicate, Download PDF
- `payment-dialog.tsx` — dialog for recording payment: amount, method (select), reference, date, notes
- `payment-history.tsx` — list of payments with method, amount, date, recorded by
- `invoice-activity-feed.tsx` — timeline of invoice events (created, sent, viewed, paid, etc.)
- `invoice-status-flow.tsx` — visual status indicator showing lifecycle progress

**Pages:**
- Update invoice detail page with payment recording and activity timeline
- `src/app/view/invoice/[token]/page.tsx` — **public** invoice view (no auth, uses `shareToken`), marks as viewed, shows pay button/bank details

### Phase 3: PDF Generation + Email

**Goal**: Generate professional branded PDF invoices and email them to clients.

**Dependencies:**
- Install `@react-pdf/renderer` (React-based PDF generation) or `puppeteer` (HTML-to-PDF)
- Recommendation: `@react-pdf/renderer` for server-side PDF generation with React components

**Server Actions / API Routes:**
- `src/app/api/invoices/[id]/pdf/route.ts` — GET: generate and return PDF
  - Fetch invoice with line items, tenant branding, bank details
  - Render using React PDF components with branding
  - Cache generated PDF URL on invoice record
- `src/lib/actions/invoice-email.ts`:
  - `sendInvoiceEmail(invoiceId, recipientEmail?, message?)` — send email with PDF attachment and public view link
  - `sendReminderEmail(invoiceId)` — send overdue reminder

**Components:**
- `invoice-pdf-template.tsx` — React PDF document component:
  - Header: owner business logo, name, address (from owner Tenant)
  - Invoice details: number, issue date, due date, reference
  - Bill-to: client name, email, address
  - Line items table: description, qty, unit price, amount
  - Totals: subtotal, tax, discount, total, amount paid, balance due
  - Footer: bank details, terms, notes
  - Branding: owner's primaryColor for header bar, fontFamily, pdfWatermark
- `invoice-preview.tsx` — in-browser preview of the invoice (HTML version matching PDF layout)
- `email-compose-dialog.tsx` — dialog to customize email subject/message before sending

**Pages:**
- Add "Preview" and "Download PDF" buttons to invoice detail page
- PDF download endpoint returns `Content-Type: application/pdf` with `Content-Disposition: attachment`

### Phase 4: Recurring Invoices + Dashboard

**Goal**: Auto-generate invoices on schedule for retainer projects. Invoice dashboard with financial overview.

**Server Actions:**
- `createRecurringInvoice(invoiceId, interval)` — mark invoice as recurring template
- `generateNextRecurringInvoice(invoiceId)` — clone invoice with new dates, link via `parentInvoiceId`
- `processRecurringInvoices(tenantId)` — batch: find recurring invoices where `nextRecurringDate <= now`, generate new invoices, advance next date
- `getInvoiceDashboard(tenantId)` — aggregate stats:
  - Total outstanding (sent + overdue amounts)
  - Total overdue
  - Total paid (this month / this quarter / this year)
  - Revenue by month (for chart)
  - Revenue by client (top 5)
  - Aging report: current / 1-30 days / 31-60 / 61-90 / 90+

**Components:**
- `invoice-dashboard.tsx` — summary cards (outstanding, overdue, paid this month), revenue chart, aging breakdown, recent invoices, top clients
- `recurring-invoice-settings.tsx` — configure recurring interval on an invoice
- `aging-report.tsx` — table showing invoices grouped by age bucket with totals
- `revenue-chart.tsx` — monthly bar chart of invoiced vs paid amounts

**Pages:**
- `src/app/(platform)/africs/accounting/invoices/dashboard/page.tsx` — financial overview
- Add cron job or manual trigger for recurring invoice generation

### Phase 5: Advanced Features (Future)

- **Credit notes** — issue credit for partial/full refunds, linked to original invoice
- **Expense tracking** — log project expenses, include as line items or separate report
- **Multi-currency** — exchange rate tracking, convert to base currency for reports
- **Tax profiles** — multiple tax rates (VAT, GST), tax-inclusive/exclusive pricing
- **Invoice templates** — customizable PDF layouts (modern, classic, minimal)
- **Client portal payments** — integrate Stripe/Paystack for online payment from public view page
- **Bulk invoicing** — generate invoices for multiple projects at once
- **QuickBooks/Xero export** — export invoice data in accounting software formats
- **Overdue automation** — automatic reminder emails on schedule (3 days, 7 days, 14 days overdue)

---

## Route Structure

```
src/app/
├── (platform)/
│   ├── africs/accounting/invoices/
│   │   ├── page.tsx                     # Invoice list (with filters + search)
│   │   ├── new/page.tsx                 # Create invoice form
│   │   ├── dashboard/page.tsx           # Financial overview (Phase 4)
│   │   ├── settings/page.tsx            # Invoice settings (numbering, bank, tax)
│   │   └── [id]/
│   │       └── page.tsx                 # Invoice detail (view/edit, payments, activity)
│   │
│   ├── clients/[slug]/
│   │   └── invoices/
│   │       ├── page.tsx                 # Client-scoped invoice list (read-only view)
│   │       └── [id]/page.tsx            # Client-facing invoice detail
│
├── view/
│   └── invoice/[token]/
│       └── page.tsx                     # Public invoice view (no auth, shareable link)
│
├── api/
│   └── invoices/
│       └── [id]/
│           └── pdf/route.ts             # PDF generation endpoint
```

---

## Key UI Patterns

**Invoice Form** (create/edit) — grouped in sections:
1. **Client**: select from existing clients (Tenant) or enter manual details, auto-fill from project's client
2. **Project**: optional project link, auto-populate billing type + rate
3. **Dates**: issue date, due date (auto-calculated from settings `defaultDueDays`)
4. **Line Items**: table with columns — Description, Qty, Unit Price, Amount. Add row button. For hourly projects: "Import Time Entries" button that creates lines from uninvoiced time entries
5. **Totals**: subtotal (auto), tax rate input, tax amount (auto), discount input, total (auto)
6. **Notes & Terms**: textarea fields, pre-filled from settings defaults
7. **Reference**: optional PO number or reference

**Invoice List** — Table view with columns: Invoice #, Client, Project, Issue Date, Due Date, Total, Status Badge, Actions. Filters: status, client, project, date range. Tabs: All / Draft / Sent / Overdue / Paid.

**Invoice Detail** — Full-width card layout:
- Header: invoice number, status badge, action buttons (Edit/Send/Record Payment/Download PDF)
- Two-column: left = invoice preview (HTML), right = payments + activity feed
- Preview matches PDF layout for WYSIWYG experience

**Public Invoice View** — Clean, minimal page:
- Invoice preview (read-only)
- "Download PDF" button
- Bank details for payment
- Status indicator (paid/unpaid)
- No navigation, no auth required

---

## Shared Components (`src/components/invoices/`)

| Component | Phase | Purpose |
|-----------|-------|---------|
| `invoice-status-badge.tsx` | 1 | Colored badge per status |
| `invoice-card.tsx` | 1 | Summary card for list view |
| `invoice-form.tsx` | 1 | Create/edit form with all sections |
| `line-item-editor.tsx` | 1 | Table editor for line items |
| `invoice-summary.tsx` | 1 | Subtotal/tax/discount/total block |
| `project-invoice-button.tsx` | 1 | "Generate Invoice" from project pages |
| `invoice-preview.tsx` | 1 | In-browser HTML invoice preview |
| `invoice-actions.tsx` | 2 | Dropdown menu with all actions |
| `payment-dialog.tsx` | 2 | Record payment dialog |
| `payment-history.tsx` | 2 | Payment list with totals |
| `invoice-activity-feed.tsx` | 2 | Timeline of invoice events |
| `invoice-pdf-template.tsx` | 3 | React PDF document component |
| `email-compose-dialog.tsx` | 3 | Customize email before sending |
| `invoice-dashboard.tsx` | 4 | Financial overview with charts |
| `recurring-invoice-settings.tsx` | 4 | Recurring interval config |
| `aging-report.tsx` | 4 | Aging breakdown table |

---

## Server Actions (`src/lib/actions/`)

**invoices.ts** (Phase 1-2):
- `getInvoices(tenantId, filters?)` — list with status/project/client/date filters
- `getInvoice(invoiceId)` — single with line items, payments, activities
- `getInvoicesForProject(projectId)` — project-scoped
- `getInvoicesForClient(clientTenantId)` — client-scoped
- `getInvoiceByToken(shareToken)` — public access
- `createInvoice(formData)` — create + auto-number
- `createInvoiceFromProject(projectId, options)` — auto-generate from billing data
- `updateInvoice(invoiceId, formData)` — draft only
- `deleteInvoice(invoiceId)` — draft only
- `duplicateInvoice(invoiceId)` — clone as new draft
- `addLineItem(invoiceId, data)`
- `updateLineItem(lineItemId, data)`
- `deleteLineItem(lineItemId)`
- `recalculateInvoiceTotals(invoiceId)`
- `sendInvoice(invoiceId)`
- `markInvoiceViewed(invoiceId)`
- `voidInvoice(invoiceId)`
- `recordPayment(invoiceId, data)`
- `deletePayment(paymentId)`
- `sendReminder(invoiceId)`

**invoice-settings.ts** (Phase 1):
- `getInvoiceSettings(tenantId)`
- `updateInvoiceSettings(tenantId, formData)`

**invoice-reports.ts** (Phase 4):
- `getInvoiceDashboard(tenantId)`
- `processRecurringInvoices(tenantId)`

All follow existing pattern: `auth()` guard -> params -> Prisma query -> `revalidatePath` -> return `{error}` or `{success}`.

---

## Integration Points

### With Projects
- "Generate Invoice" button on project detail + settings pages
- For hourly projects: pull uninvoiced time entries, aggregate by user, create line items
- For fixed projects: single line item with budget amount
- Invoice list filtered by project on project overview page
- Track which time entries have been invoiced (via `timeEntryIds` on line items) to prevent double-billing

### With Branding
- PDF invoices use the **owner tenant's** branding (Africs' logo, colors, font)
- Not the client's branding — invoices come FROM Africs TO clients
- Owner branding fields: `logoUrl`, `primaryColor`, `accentColor`, `fontFamily`, `headerLayout`, `footerText`, `pdfWatermark`

### With Notifications
- Create `Notification` records on: invoice created, sent, payment received, overdue
- `entityType: "invoice"`, `entityId: invoiceId`
- Notification types: `invoice_created`, `invoice_sent`, `payment_received`, `invoice_overdue`

### With Time Tracking
- `createInvoiceFromProject` aggregates `TimeEntry` records
- Line items reference `timeEntryIds[]` to track which time was billed
- Prevents double-billing by filtering entries already in existing invoices

---

## Verification

After Phase 1 implementation:
1. Run `npx prisma migrate dev` — verify migration applies cleanly
2. Run `pnpm build` — verify no type errors
3. Navigate to `/africs/accounting/invoices` — should show empty state
4. Go to settings, configure invoice prefix + bank details
5. Create a manual invoice with line items — verify totals calculate correctly
6. Create an invoice from a project — verify auto-population from billing data
7. For an hourly project with time entries, generate an invoice — verify time aggregation
8. Edit a draft invoice, add/remove line items — verify recalculation
9. Navigate to `/clients/[slug]/invoices` — verify only that client's invoices show
10. Duplicate an invoice — verify new draft created with new number
