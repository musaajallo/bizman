# AfricsCore — Implementation Status & TODO

Last updated: 2026-03-24

> **Legend:** ✅ DONE | 🔄 IN PROGRESS | 🔲 NOT STARTED | 🪧 STUB (page exists, no real functionality)

---

## Platform Shell & Core ✅

### Auth & Multi-Tenancy — DONE
- [x] Auth.js v5 with credentials provider, JWT sessions
- [x] Sign-in / sign-up pages
- [x] Proxy-based route protection
- [x] AuthGuard client-side fallback
- [x] Multi-tenant model (Tenant, TenantUser)
- [x] Super Admin bypass

### Layout & Navigation — DONE
- [x] Sidebar with company switcher
- [x] Workspace store (Zustand, persisted)
- [x] Theme toggle (light/dark)
- [x] Provider stack (Theme > Session > Tooltip)

### Company Management — DONE
- [x] Client company CRUD
- [x] Branding customization
- [x] Divisions, Departments, Units, Sub-units, Countries, Locations pages
- [x] Statutory Registers page
- [x] Settings pages (branding, integrations, notifications, preferences, security, team)
- [ ] Org Structure: condense hierarchy into single drag-and-drop page

### Settings — DONE (core)
- [x] Branding
- [x] Communications (email settings)
- [x] Integrations UI (Claude, WhatsApp, Resend, MailChimp, social platforms, SMTP, Google Drive, OneDrive)
- [x] Invoice settings (defaults, bank, tax, email, recurring)
- [x] HR settings (leave tiers, overtime)
- [x] Notifications
- [x] Preferences
- [x] Security
- [x] Team management
- [ ] Module activation — enable/disable modules at category + subcategory level
- [ ] License manager

### Tools — STUB 🪧
- [ ] Form Builder (`/tools/form-builder`) — currently nav link only
- [ ] eSign (`/tools/sign`) — currently nav link only
- [ ] AI assistant (`/tools/ai`) — currently nav link only

---

## Project Management Module ✅

### Phase 1–4 — DONE
- [x] Prisma models: Project, ProjectMember, ProjectStatus, Task, TaskComment, TaskChecklist, TaskChecklistItem, Milestone, ProjectActivity, TaskDependency, TimeEntry, ProjectTemplate
- [x] Full CRUD: projects, tasks, statuses, members, milestones, activity log
- [x] Views: list, board (Kanban), calendar, timeline
- [x] Time tracking (log, report)
- [x] Templates (create from project, apply to new project)
- [x] Bulk operations (status, priority, assignee, due date, delete)
- [x] Cross-project dashboard + profitability report
- [x] Pages: list, new, overview, board, calendar, timeline, time, settings, reports, templates
- [x] Client-scoped pages mirrored under `/clients/[slug]/projects/`

### Phase 5: Milestones, Payment Triggers & Task Hierarchy — NOT STARTED 🔲
> Milestones become structural containers: tasks and sub-tasks live under a milestone. Each milestone can carry a payment trigger that auto-generates an invoice on demand.

#### Milestone Enhancements
- [ ] Prisma model updates: add `milestoneId` to `Task` (link tasks to a milestone), enhance `Milestone` with description, completion status, payment trigger fields
- [ ] Milestone view within a project: list milestones with their tasks collapsed/expanded under each
- [ ] Tasks and sub-tasks assignable to a milestone (milestone acts as a grouping layer above tasks)
- [ ] Milestone progress: auto-calculated from % of linked tasks completed
- [ ] Milestone status: not_started → in_progress → completed → delayed
- [ ] Re-order milestones via drag-and-drop

#### Payment Triggers
- [ ] Prisma model: `MilestonePayment` — amount, currency, invoiceId (null until triggered), notes, triggerType (on_completion | manual), triggeredAt, triggeredById
- [ ] Each milestone can have one payment trigger (amount, currency, description)
- [ ] "Trigger Payment" action button on milestone → creates a draft invoice pre-filled with: client from project, line item = milestone name + description, amount from trigger, project reference
- [ ] Triggered invoice linked back to milestone (can't trigger twice unless previous invoice is voided)
- [ ] Milestone card shows payment status: pending / invoiced / paid (derived from linked invoice status)

#### Gantt / Timeline
- [ ] Gantt chart view with milestones as major markers and tasks as bars
- [ ] Dependency arrows between tasks

### Phase 6: Delay Tracking & Communications Log — NOT STARTED 🔲
> Structured audit trail of delays and all client communications per task and milestone. Both logs are exportable as CSV and PDF.

#### Delay Tracking
- [ ] Prisma model: `TaskDelay` — taskId, milestoneId (optional), originalDueDate, revisedDueDate, delayDays (computed), reason (text), impact (text), clientNotified (bool), recordedById, createdAt
- [ ] Log a delay from the task detail panel: captures original due date, new due date, reason, impact description
- [ ] Delay automatically flags the task and milestone with a "delayed" indicator
- [ ] Delay history tab on task detail (all logged delays for that task)
- [ ] Project-level delay log: all delays across all tasks and milestones, filterable by date / milestone / severity
- [ ] Export delay log: CSV (all fields) + PDF (formatted report with project header, delay table, total days lost)

#### Client Communications Log
- [ ] Prisma model: `ProjectCommunication` — projectId, taskId (optional), milestoneId (optional), direction (inbound | outbound), channel (email | phone | meeting | message | portal), subject, content (text), attachmentUrls (string[]), contactName, contactEmail, recordedById, communicatedAt, createdAt
- [ ] Log a communication from task detail or project-level comms tab: direction, channel, contact, subject, body, date/time
- [ ] Communications tab on task detail: chronological log of all comms for that task
- [ ] Project-level communications log: all comms across all tasks, filterable by channel / direction / task / date range
- [ ] Export communications log: CSV (all fields) + PDF (formatted log with project header, grouped by task or date)
- [ ] Bulk export: download both delay log and comms log as a combined ZIP

### Phase 7: Tenders — NOT STARTED 🔲
- [ ] Prisma models: Tender, TenderDocument, TenderBid
- [ ] Create and track tenders (application → shortlisted → awarded → complete)
- [ ] Attach documents to tenders
- [ ] Link awarded tender to a project

### Phase 7: Service Packages — NOT STARTED 🔲
- [ ] Prisma models: ServicePackage, ServicePackageItem
- [ ] Maintain a list of billable services (e.g. Visual Identity Design, HR Setup, Logo Design)
- [ ] Attach service package to a project
- [ ] Auto-attach resource templates based on selected package
- [ ] Service revenue reporting (which services generate the most revenue)

---

## Accounting Module 🔄

### Phases 1–4 — DONE
- [x] Prisma models: InvoiceSettings, Invoice, InvoiceLineItem, InvoicePayment, InvoiceActivity, TaxProfile
- [x] Full lifecycle: draft → sent → viewed → paid / overdue / void
- [x] Proforma flow: draft → sent → viewed → accepted → converted / expired / void
- [x] Credit notes
- [x] Recurring invoices + cron automation
- [x] Overdue detection + automated email reminders (cron)
- [x] Tax profiles (named rates, default pre-fill in form)
- [x] PDF generation (InvoicePdfTemplate — standard, proforma, credit note labels)
- [x] Email sending (Resend)
- [x] Public invoice view (`/view/invoice/[token]`)
- [x] Invoice dashboard (stat cards, revenue chart, aging report, top clients)
- [x] Settings: defaults, bank details, tax, email, recurring, proforma prefix

### Phase 5: Advanced — IN PROGRESS 🔄
- [x] Proforma invoices
- [x] Credit notes
- [x] Expense tracking
- [x] Bills & vendor management
- [x] Tax profiles
- [x] Overdue automation
- [ ] Multi-currency with live exchange rates
- [ ] Invoice templates (multiple PDF layouts)
- [ ] Bulk invoicing
- [ ] QuickBooks / Xero export
- [ ] Wave Payments integration
- [ ] Client portal payments (Stripe / Paystack)
- [ ] Invoice notifications (in-app + email on send, view, payment)
- [ ] Billable services list — track which services generate revenue

### Procurement (Internal Buying) — NOT STARTED 🔲
> Staff raise purchase requests internally. Manager approves, PO is issued to supplier, goods/services received, bill recorded.
- [ ] Prisma models: Vendor, PurchaseRequisition, PurchaseRequisitionItem, PurchaseOrder, PurchaseOrderItem, PurchaseReceipt
- [ ] Vendor register (name, contact, category, payment terms, rating)
- [ ] Requisition flow: draft → submitted → approved / rejected → PO raised
- [ ] Purchase Order: issued to vendor, tracks expected delivery
- [ ] Receive goods: partial or full receipt, outstanding quantities tracked
- [ ] Link received PO to bill (Accounting) for payment
- [ ] Approval rules: configurable spend thresholds per approver tier
- [ ] Dashboard: open requisitions, pending POs, overdue deliveries

### Tender Management (Issuing Tenders) — NOT STARTED 🔲
> Company issues a formal tender / RFP inviting multiple suppliers to bid competitively. Used for large or complex purchases. Awarded tender feeds into Procurement (PO) or a Project.
- [ ] Prisma models: Tender, TenderDocument, TenderBid, TenderBidItem, TenderEvaluation
- [ ] Tender lifecycle: draft → published → bids open → evaluation → awarded → closed / cancelled
- [ ] Publish tender with scope, requirements, deadline, and attached documents
- [ ] Receive and record supplier bids (vendor, price breakdown, documents)
- [ ] Evaluation matrix: score bids on weighted criteria (price, quality, delivery, compliance)
- [ ] Award tender to winning bidder → auto-create PO or Project
- [ ] Notify unsuccessful bidders
- [ ] Dashboard: active tenders, bids received per tender, upcoming deadlines

### Bid Management (Applying to Tenders) — NOT STARTED 🔲
> Company identifies and responds to external tenders issued by other organisations. Tracks the full bid pipeline from opportunity through to win/loss. Won bid creates a Project.
- [ ] Prisma models: BidOpportunity, BidDocument, BidSubmission, BidActivity
- [ ] Opportunity lifecycle: identified → qualifying → preparing → submitted → shortlisted → won / lost / withdrawn
- [ ] Capture opportunity details: issuing org, sector, value estimate, deadline, source
- [ ] Attach bid documents (proposal, financials, certificates)
- [ ] Team assignment: who is responsible for each bid
- [ ] Win/loss reasons and post-bid review notes
- [ ] Won bid → auto-create Project (pre-filled with client, value, scope)
- [ ] Dashboard: pipeline by stage, win rate, total bid value in progress, upcoming submission deadlines

### Assets — STUB 🪧
- [ ] Prisma models: Asset, AssetMaintenance, AssetAssignment
- [ ] Asset register (track equipment, furniture, tech)
- [ ] Assignment to employees or locations
- [ ] Maintenance log and scheduling
- [ ] Depreciation tracking

---

---

## Finance Module — STUB 🪧

> Analytical layer — reads from Accounting. No data entry here; it aggregates invoices, bills, expenses, and payroll into statements and projections.

### Phase 1: Financial Statements — NOT STARTED 🔲
- [ ] Prisma models: JournalEntry, Account (chart of accounts), AccountingPeriod
- [ ] Accrual accounting engine — link invoices → AR, bills → AP, payroll → expenses, payments → cash
- [ ] P&L (Income Statement) — revenue vs. expenses for any date range
- [ ] Balance Sheet — assets, liabilities, equity at a point in time
- [ ] Cash Flow Statement — operating, investing, financing activities
- [ ] Finance dashboard — key KPIs (gross margin, net profit, cash position, burn rate)

### Phase 2: Budgets — NOT STARTED 🔲
- [ ] Prisma models: Budget, BudgetLine
- [ ] Create annual / quarterly budgets by category
- [ ] Actuals vs. budget variance view
- [ ] Alerts when spend exceeds budget thresholds

### Phase 3: Forecasting — NOT STARTED 🔲
- [ ] Revenue forecasting (pipeline + recurring invoice projection)
- [ ] Expense forecasting (payroll + recurring bills)
- [ ] Cash flow forecast (12-month rolling)
- [ ] Scenario modelling (optimistic / base / pessimistic)

---

## HR Module 🔄

### Core — DONE
- [x] Prisma models: Employee, EmployeeDocument
- [x] Employee profiles (full form, TIN, citizenship, country)
- [x] Status tracking (active, on_leave, suspended, terminated, resigned)
- [x] Staff ID card + Business card (PDF)
- [x] Employee profile PDF export

### Time & Attendance — NOT STARTED 🔲
> Hardware-agnostic clock-in/out system. Supports ZKTeco device integration, third-party scanners via webhook, and an independent QR code companion app. Feeds into Timesheets, Overtime, and Payroll.

#### Phase 1: Core Engine
- [ ] Prisma models: AttendanceDevice, AttendanceRecord, AttendanceLog, Shift, ShiftAssignment, EmployeeQRCode
- [ ] Shift definitions (start/end time, break duration, grace period, applicable days)
- [ ] Shift assignment per employee or department
- [ ] Raw attendance record ingestion (clock-in / clock-out, source, device)
- [ ] Daily log processing: derive present/absent/late/early-departure/overtime from raw records
- [ ] Manual record entry and correction (admin/HR override)
- [ ] Dashboard: today's attendance summary, who's in/out, late arrivals, absences

#### Phase 2: QR Code (Independent Mode)
- [ ] QR code generation per employee (unique, rotatable, with optional expiry)
- [ ] QR codes printed on staff ID cards or accessible in employee self-service
- [ ] Companion web app / PWA at `/scan` (kiosk mode, no auth required at device level)
- [ ] Scan UI: camera feed → decode QR → POST to `/api/attendance/qr` → show employee name + time
- [ ] Device-level token auth so only registered kiosks can submit scans
- [ ] Offline queue: buffer scans when offline, sync on reconnect

#### Phase 3: ZKTeco Integration
- [ ] ZKTeco PUSH (ADMS) receiver endpoint: `/api/attendance/zkteco`
- [ ] Handle ZKTeco handshake (device registration, heartbeat, command queue)
- [ ] Parse attendance push payload (employee ID, timestamp, verification type: finger/face/card)
- [ ] Device management UI: register devices, view last heartbeat, force sync
- [ ] Employee enrollment mapping: link ZKTeco user ID to Employee record
- [ ] Support pulling historical logs from device on first sync

#### Phase 4: Third-Party & Generic Integration
- [ ] Generic webhook endpoint: `/api/attendance/webhook` with HMAC auth
- [ ] Documented payload spec for third-party fingerprint/QR scanners to POST to
- [ ] FaceID support: WebAuthn-based clock-in from mobile browser (no extra hardware)
- [ ] API key management: per-device keys issued from admin UI

#### Phase 5: Reporting & Payroll Integration
- [ ] Monthly attendance report per employee (days present, absent, late, hours worked)
- [ ] Auto-generate timesheets from attendance logs (pending employee/HR confirmation)
- [ ] Flag discrepancies between attendance log and submitted timesheets
- [ ] Late/absent threshold alerts (notify manager after N occurrences)
- [ ] Export attendance data for payroll run

### Timesheets — DONE
- [x] Prisma models: Timesheet, TimesheetEntry
- [x] Full workflow: draft → submitted → approved / rejected → reopened
- [x] Pages: list, new, detail, edit

### Overtime — DONE
- [x] Prisma models: OvertimeRequest
- [x] Types: standard / weekend / holiday with rate multipliers
- [x] Approval flow + timesheet sync + payroll integration
- [x] In-app notifications (manager on submit, employee on review)

### Leave Management — DONE
- [x] Prisma models: LeaveBalance, LeaveRequest
- [x] Leave types, balances, request → review flow
- [x] Bulk allocation, calendar view
- [x] Annual leave tier settings (years of service → days entitlement)
- [ ] Leave types to add: administrative leave, paid leave, leave buy-back
- [ ] Entitlement rules: annual (2 wks/yr), maternity (6 months, combinable with annual), paternity (10 days), sick (1.5 days/month accrual)
- [ ] Resignation notice config: 1 day (probation), 1 month (full-time), 2 months (6+ yrs)
- [ ] Per-staff country-of-operation for correct public holidays

### Payroll — DONE
- [x] Prisma models: PayrollRun, Payslip
- [x] Full run lifecycle: draft → processed → paid
- [x] Payslip PDF
- [x] Overtime integration

### Recruitment — DONE ✅
- [x] Prisma models: JobPosting, Application (with TalentPoolEntry link)
- [x] Job postings (draft → open → closed / filled)
- [x] Applicant pipeline (applied → screening → interview → offer → hired / rejected)
- [x] Kanban board per posting with drag-to-stage
- [x] Application detail page (rate, notes, reject, move stage)
- [ ] Link hired applicant to Employee record

### Appraisals — DONE ✅
- [x] Prisma models: AppraisalCycle, Appraisal, AppraisalRating, AppraisalGoal
- [x] Configurable appraisal cycles (draft → active → closed)
- [x] Activating a cycle auto-creates appraisals for all active employees
- [x] Self-assessment + manager review workflow
- [x] Per-criterion ratings (6 default criteria)
- [x] Goal tracking per appraisal (with progress)
- [x] Avg rating stats on dashboard
- [ ] Link to promotion/disciplinary flows

### Benefits Management — NOT STARTED 🔲
- [ ] Prisma models: BenefitType, EmployeeBenefit
- [ ] Define benefit types (medical, pension, transport allowance, etc.)
- [ ] Assign benefits per employee or grade
- [ ] Payroll integration (benefits as deductions/additions)

### Promotion & Disciplinary Flows — NOT STARTED 🔲
- [ ] Prisma models: PromotionRecord, DisciplinaryRecord, DisciplinaryNotice
- [ ] Promotion workflow (propose → HR review → approved → update employee grade)
- [ ] Disciplinary workflow (verbal → written → final warning → termination)
- [ ] Notice generation (PDF)

### Health & Safety — NOT STARTED 🔲
- [ ] Prisma models: IncidentReport, SafetyAudit
- [ ] Incident reporting and tracking
- [ ] Safety audit log

### Staff Transcript — NOT STARTED 🔲
- [ ] Auto-generated report: hours worked, projects completed, leave history, appraisal scores
- [ ] PDF export

### Recommendation Requests — NOT STARTED 🔲
- [ ] In-app request flow (employee requests, manager approves and writes)
- [ ] Email delivery of final recommendation letter

### Referrals — DONE ✅
- [x] Prisma models: Referral (linked to Employee referrer + optional JobPosting)
- [x] Submit referral form (employee, candidate info, optional job link)
- [x] Status workflow: submitted → reviewed → interviewing → hired / rejected
- [x] Leaderboard: top referrers by hired count
- [ ] Reward tracking

### Talent Pool — DONE ✅
- [x] Prisma models: TalentPoolEntry (with Application link)
- [x] Public self-apply form at `/talent-pool` (unauthenticated)
- [x] Internal candidate list with status tabs (new → reviewed → shortlisted → archived)
- [x] Candidate detail with application history
- [x] Status management + delete
- [x] Link candidates directly to job postings as applications

### Onboarding — NOT STARTED 🔲
- [ ] Dedicated module for probationary staff
- [ ] Onboarding checklist per employee
- [ ] Task assignment to HR/IT/manager for setup steps
- [ ] Probation review and conversion to full-time

### Reminders & Notifications — NOT STARTED 🔲
- [ ] Clock-in / clock-out reminders (push + email)
- [ ] Employee of the Month voting reminder
- [ ] Leave balance expiry alerts

### Batch Printing — NOT STARTED 🔲
- [ ] Queue multiple staff ID cards and business cards for a single print job
- [ ] PDF merge of selected employees

### Org Structure Page — NOT STARTED 🔲
- [ ] Single page replacing Divisions / Departments / Units / Sub-units
- [ ] Drag-and-drop hierarchy builder
- [ ] Visual org chart

---

## Documents Module 🔄

### Phase 1: Core Upload & List — DONE
- [x] Prisma models: Document, DocumentVersion
- [x] S3-compatible file storage (`src/lib/storage.ts` — AWS S3, Cloudflare R2, MinIO, Backblaze B2)
- [x] Upload route handler (`/api/documents/upload`)
- [x] Server actions: getDocuments, getDocumentFolders, createDocument, renameDocument, deleteDocument
- [x] Upload UI: drag-and-drop dialog, folder selection, tags, description
- [x] List view: table with folder sidebar, search, download, rename, delete

### Phase 2: Versioning — NOT STARTED 🔲
- [ ] Upload new version dialog
- [ ] Version history panel
- [ ] Download specific version

### Phase 3: Organization & Search — NOT STARTED 🔲
- [ ] Virtual folder management (create, rename, move)
- [ ] Tag management UI
- [ ] Full-text search across document names and tags
- [ ] Bulk operations (move, delete, download)

### Phase 4: Preview & Sharing — NOT STARTED 🔲
- [ ] In-browser preview (PDF, images)
- [ ] Share links with expiry
- [ ] Per-document access control

---

## Docs (Knowledge Base) Module 🔄

### Phase 1: Core CRUD — PARTIAL
- [x] Prisma models: DocPage, DocRevision
- [x] Page: `/africs/docs`
- [ ] Server actions (verification needed)
- [ ] Markdown rendering
- [ ] Single `.md` upload with frontmatter parsing
- [ ] Ensure documents are Markdown-based with database field templating support

### Phase 2: In-App Editor + Versioning — NOT STARTED 🔲
- [ ] Markdown editor component (split preview)
- [ ] Save flow with revision creation
- [ ] Version history panel + restore

### Phase 3: Docs Site Layout — NOT STARTED 🔲
- [ ] Sidebar navigation tree
- [ ] Breadcrumb navigation
- [ ] Table of contents (auto from headings)
- [ ] Full-text search
- [ ] Previous / Next page navigation

### Phase 4: Bulk Upload & Management — NOT STARTED 🔲
- [ ] Zipped folder upload
- [ ] Drag-and-drop reordering
- [ ] Bulk publish / unpublish / archive

---

## Hub (Resource Center) — STUB 🪧
- [ ] Centralized list of URLs and descriptions for key platforms (tools staff need access to)
- [ ] Categorized shortcut grid
- [ ] Admin-managed (add/edit/remove links)

---

## CRM Module — STUB 🪧

### Phase 1: Clients & Contacts — NOT STARTED 🔲
- [ ] Prisma models: Lead, Contact, Interaction, Pipeline, PipelineStage
- [ ] Lead tracking (source, status, assigned to)
- [ ] Contact management (separate from Tenant/client company)
- [ ] Interaction log (calls, emails, meetings)
- [ ] Client contact hours (configurable time window for contacting clients)
- [ ] Client time-zone tracker (avoid contacting outside working hours)

### Phase 2: Pipeline & Appointments — NOT STARTED 🔲
- [ ] Visual pipeline (Kanban by stage)
- [ ] Appointments calendar
- [ ] Follow-up reminders
- [ ] Convert lead → client company

### Phase 3: Client Portal — NOT STARTED 🔲
- [ ] Dedicated portal for clients to log in and view their projects, invoices, documents
- [ ] Client user accounts (created from client contact records)
- [ ] Portal-specific permissions

---

## Marketing Module — STUB 🪧

### Phase 1: Email Marketing — NOT STARTED 🔲
- [ ] Prisma models: EmailCampaign, EmailList, EmailSubscriber
- [ ] Campaign builder (subject, HTML body, recipient list)
- [ ] Send via Resend / MailChimp integration
- [ ] Open/click tracking

### Phase 2: Social Marketing — NOT STARTED 🔲
- [ ] Connect social accounts (Facebook, Instagram, LinkedIn, TikTok, X, YouTube)
- [ ] Post composer and scheduler
- [ ] Basic analytics (reach, engagement)

### Phase 3: SMS Marketing — NOT STARTED 🔲
- [ ] SMS campaign builder
- [ ] Bulk send to subscriber list
- [ ] SMS integration (Twilio or similar)

### Phase 4: Events & Automation — NOT STARTED 🔲
- [ ] Event creation and registration tracking
- [ ] Marketing automation rules (e.g. send email when lead moves to stage X)
- [ ] Survey builder and response tracking

---

## Sales Module — STUB 🪧

### Phase 1: Orders — NOT STARTED 🔲
- [ ] Prisma models: SalesOrder, SalesOrderItem, SalesQuote
- [ ] Quote → order → fulfilled flow
- [ ] Link to invoicing

### Phase 2: POS — NOT STARTED 🔲
- [ ] POS Shop (retail checkout UI)
- [ ] POS Restaurant (table + order management)
- [ ] Payment recording

### Phase 3: Subscriptions & Rental — NOT STARTED 🔲
- [ ] Recurring subscription billing
- [ ] Rental tracking (out / returned / overdue)

---

## Services Module — STUB 🪧

### Phase 1: Field Service — NOT STARTED 🔲
- [ ] Prisma models: ServiceJob, ServiceJobAssignment, ServiceChecklist
- [ ] Job creation and assignment to field staff
- [ ] Checklist completion on-site
- [ ] Status tracking (scheduled → in progress → completed)

### Phase 2: Helpdesk — NOT STARTED 🔲
- [ ] Prisma models: Ticket, TicketMessage, TicketCategory
- [ ] Ticket intake (IT, Legal, Business Development queues)
- [ ] Priority + assignment + SLA tracking
- [ ] Internal comments + client-facing replies

### Phase 3: Appointments & Planning — NOT STARTED 🔲
- [ ] Appointment scheduling calendar
- [ ] Staff capacity planning view

---

## Fleet Module — STUB 🪧

### Phase 1: Vehicle & Driver Registry — NOT STARTED 🔲
- [ ] Prisma models: Vehicle, Driver, VehicleAssignment
- [ ] Vehicle register (make, model, plate, status)
- [ ] Driver profiles
- [ ] Vehicle-to-driver assignment log

### Phase 2: Maintenance & Inspections — NOT STARTED 🔲
- [ ] Prisma models: VehicleMaintenance, VehicleInspection
- [ ] Maintenance scheduling and log
- [ ] Pre/post-trip inspection checklists
- [ ] Reminders for upcoming service

### Phase 3: Fuel & Utilization — NOT STARTED 🔲
- [ ] Fuel log (fill-ups, cost, mileage)
- [ ] Utilization report (km driven, idle days)
- [ ] Cost-per-km reporting

---

## Communications Module — STUB 🪧

### Chat — NOT STARTED 🔲
- [ ] Real-time team chat (channels + direct messages)
- [ ] File sharing in chat
- [ ] Integration with notification system

### Email — NOT STARTED 🔲
- [ ] Full SMTP integration (send + receive)
- [ ] Email signature management per user
- [ ] Shared inbox for team
- [ ] Link emails to clients/projects

### SMS Notifications — NOT STARTED 🔲
- [ ] Send SMS notifications to clients (invoice sent, payment received)
- [ ] SMS integration (Twilio or Africa's Talking)

---

## Store Module — STUB 🪧

### eCommerce — NOT STARTED 🔲
- [ ] Product catalogue
- [ ] Online storefront
- [ ] Order management + fulfilment
- [ ] Payment gateway integration

### Inventory — STUB 🪧
- [ ] Prisma models: InventoryItem, StockMovement, Warehouse
- [ ] Stock levels and locations
- [ ] Stock movement log (in/out/transfer)
- [ ] Low-stock alerts
- [ ] Link to procurement and sales orders

---

## Partnerships Module — STUB 🪧
- [ ] Prisma models: Partner, PartnerProduct, PartnerContact
- [ ] Track potential and active partners
- [ ] Partner products/services catalogue
- [ ] Partner locations
- [ ] Partner Portal (similar to Client Portal)

---

## Academy Module — NOT STARTED 🔲
- [ ] Prisma models: Course, CourseModule, CourseEnrollment, CourseProgress
- [ ] Video hosting or embedding (YouTube / Vimeo links)
- [ ] Module-by-module progress tracking
- [ ] Completion certificates (PDF)
- [ ] Role-based course assignment (e.g. all new hires see onboarding course)

---

## Industry Extension: Construction — NOT STARTED 🔲
- [ ] Pickup & Delivery: track materials and equipment pickups/deliveries
- [ ] Construction Sites: manage and monitor active sites
- [ ] Site Supervisor Assignments: assign supervisors to specific sites
- [ ] Building Inspections: log and track inspections
- [ ] Vendor Appraisals: rate/review vendors after project completion

---

## Website Management — NOT STARTED 🔲
- [ ] Basic CMS for managing the company's public website content
- [ ] Pages, blog posts, team members
- [ ] Link to Docs/Knowledge Base for public-facing content

---

## Digital Signage — NOT STARTED 🔲
- [ ] Slideshow/playlist builder in-app
- [ ] Android companion app for TV displays
- [ ] Schedule-based content rotation
- [ ] Xibo-compatible or custom protocol

---

## Cross-Cutting TODO

- [ ] Notification integration for invoicing events (sent, viewed, paid, overdue)
- [ ] In-app notification centre (bell icon, unread count)
- [x] Email sending (Resend — wired up)
- [x] Production file storage (S3-compatible — `src/lib/storage.ts`)
- [ ] Verify all public/shared routes work without auth (`/view/invoice/[token]`, future client portal)
- [ ] Mobile responsiveness audit (tables throughout the app)
- [ ] User management — create user accounts from employee and client contact records
- [ ] Knowledge Sidebar — collapsible right panel with context info (triggered by info icons on dashboards)
- [ ] End-to-end testing
- [ ] Railway deployment (cron via Railway dashboard, S3 env vars, AUTH_URL)
