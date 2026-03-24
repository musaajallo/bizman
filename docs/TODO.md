# AfricsCore — Implementation Status & TODO

Last updated: 2026-03-22

---

## Project Management Module

### Phase 1: Core Project CRUD + Task List View — DONE
- [x] Prisma models: Project, ProjectMember, ProjectStatus, Task + relations
- [x] Server actions: `projects.ts` — getProjects, getProjectBySlug, createProject (with default status seeding), updateProject, updateProjectStatus, archiveProject, getProjectMembers, addProjectMember, removeProjectMember, getProjectStats
- [x] Server actions: `tasks.ts` — getTasksByProject, createTask, updateTask, updateTaskStatus, deleteTask, reorderTasks, getTaskDetail, getTasksByStatus
- [x] Project categories (getProjectCategories, createProjectCategory)
- [x] Custom statuses per project (getProjectStatuses, createProjectStatus, updateProjectStatusItem, deleteProjectStatus, reorderProjectStatuses)
- [x] Components: status-badge, priority-indicator, project-board-card, project-progress, member-avatar-group, task-row, quick-add-task, view-switcher
- [x] Pages: `/africs/projects`, `/africs/projects/new`, `/africs/projects/[projectSlug]/overview`, `/africs/projects/[projectSlug]/settings`
- [x] Client-scoped pages: `/clients/[slug]/projects`, `/clients/[slug]/projects/new`, `/clients/[slug]/projects/[projectSlug]/overview`, `/clients/[slug]/projects/[projectSlug]/settings`

### Phase 2: Board View, Task Detail, Comments, Checklists — DONE
- [x] Prisma models: TaskComment, TaskChecklist, TaskChecklistItem
- [x] Server actions: `task-comments.ts` — getTaskComments, createTaskComment, updateTaskComment, deleteTaskComment
- [x] Server actions: `task-checklists.ts` — getTaskChecklists, createChecklist, deleteChecklist, addChecklistItem, toggleChecklistItem, deleteChecklistItem
- [x] Components: task-card, task-detail-sheet, comment-feed, checklist, status-manager
- [x] Board view pages: `/africs/projects/[projectSlug]/board`, `/clients/[slug]/projects/[projectSlug]/board`, `/africs/projects/board`, `/clients/[slug]/projects/board`
- [x] Subtask support (parent-child via parentId)

### Phase 3: Milestones, Activity Log, Calendar, Dashboard — DONE
- [x] Prisma models: Milestone, ProjectActivity
- [x] Server actions: `milestones.ts` — getMilestones, createMilestone, updateMilestone, toggleMilestone, deleteMilestone
- [x] Server actions: `project-activity.ts` — recordActivity, getProjectActivities
- [x] Components: milestone-list, activity-feed, task-calendar, project-dashboard
- [x] Calendar view pages: `/africs/projects/[projectSlug]/calendar`, `/clients/[slug]/projects/[projectSlug]/calendar`
- [x] Activity auto-recording on status changes, member additions, task updates

### Phase 4: Advanced Features — DONE
- [x] Prisma models: TaskDependency, TimeEntry, ProjectTemplate, ProjectTemplateTask
- [x] Server actions: `task-dependencies.ts` — getTaskDependencies, addDependency, removeDependency, checkCircular, getAvailableDependencies
- [x] Server actions: `time-entries.ts` — getTimeEntries, logTime, deleteTimeEntry, getProjectTimeReport
- [x] Server actions: `project-templates.ts` — getTemplates, getTemplate, createTemplateFromProject, createProjectFromTemplate, deleteTemplate
- [x] Server actions: `bulk-operations.ts` — bulkUpdateTaskStatus, bulkUpdateTaskPriority, bulkAssignTasks, bulkDeleteTasks, bulkSetDueDate
- [x] Server actions: `project-reports.ts` — getCrossProjectDashboard, getProjectProfitability
- [x] Components: task-timeline, task-dependencies, time-tracker, time-report, template-manager, bulk-actions-bar, project-reports
- [x] Timeline pages: `/africs/projects/[projectSlug]/timeline`, `/clients/[slug]/projects/[projectSlug]/timeline`
- [x] Time tracking pages: `/africs/projects/[projectSlug]/time`, `/clients/[slug]/projects/[projectSlug]/time`
- [x] Templates page: `/africs/projects/templates`
- [x] Reports page: `/africs/projects/reports`

---

## Invoicing Module

### Phase 1: Core Invoice CRUD + Line Items — DONE
- [x] Prisma models: InvoiceSettings, Invoice, InvoiceLineItem + relations
- [x] Server actions: getInvoices, getInvoice, getInvoicesForProject, getInvoicesForClient, createInvoice, createInvoiceFromProject, updateInvoice, deleteInvoice, duplicateInvoice
- [x] Server actions: addLineItem, updateLineItem, deleteLineItem, recalculateInvoiceTotals
- [x] Server actions: getInvoiceSettings, updateInvoiceSettings
- [x] Components: invoice-form, line-item-editor, invoice-status-badge, invoice-summary, project-invoice-button, invoice-preview
- [x] Pages: `/africs/accounting/invoices`, `/africs/accounting/invoices/new`, `/africs/accounting/invoices/[id]`, `/africs/accounting/invoices/[id]/edit`

### Phase 2: Invoice Lifecycle + Payments — DONE
- [x] Prisma models: InvoicePayment, InvoiceActivity
- [x] Server actions: sendInvoice, markInvoiceViewed, recordPayment, deletePayment, voidInvoice, sendReminder
- [x] Components: invoice-detail-actions, payment-dialog, payment-history, invoice-activity-feed, invoice-status-flow, invoice-detail-sidebar
- [x] Payments page: `/africs/accounting/payments`
- [ ] Public invoice view page (`/view/invoice/[token]`) — needs verification
- [ ] Client-scoped invoice list (`/clients/[slug]/invoices`) — needs verification

### Phase 3: PDF Generation + Email — DONE
- [x] Components: invoice-pdf-template, email-compose-dialog
- [ ] API route: `/api/invoices/[id]/pdf/route.ts` — needs verification
- [ ] Email sending integration (Resend or similar)

### Phase 4: Recurring Invoices + Dashboard — DONE
- [x] Components: recurring-invoice-settings, process-recurring-button, revenue-chart, aging-report
- [x] Settings pages: `/africs/settings/invoices/defaults`, `/africs/settings/invoices/bank`, `/africs/settings/invoices/tax`, `/africs/settings/invoices/email`, `/africs/settings/invoices/recurring`
- [ ] Cron job or scheduled trigger for recurring invoice generation
- [ ] Invoice dashboard page (`/africs/accounting/invoices/dashboard`) — needs verification

### Phase 5: Advanced Features — IN PROGRESS
- [x] Proforma invoices (type field, separate numbering, accept/convert/expire flow, PDF/preview labels)
- [ ] Credit notes
- [x] Expense tracking
- [x] Bills & vendor management (accounts payable)
- [ ] Multi-currency exchange rates
- [ ] Tax profiles (multiple rates, VAT/GST)
- [ ] Invoice templates (multiple PDF layouts)
- [ ] Client portal payments (Stripe/Paystack)
- [ ] Bulk invoicing
- [ ] QuickBooks/Xero export
- [ ] Overdue automation (scheduled reminders)

---

## Documents Module

### Phase 1: Core Upload & List — DONE
- [x] Prisma models: Document, DocumentVersion
- [x] Page: `/africs/documents`
- [ ] Server actions — needs verification of completeness
- [ ] Upload UI, list view, folder filtering — needs verification

### Phase 2: Versioning — NOT STARTED
- [ ] Upload new version dialog
- [ ] Version history panel
- [ ] Download specific version
- [ ] Version comparison

### Phase 3: Organization & Search — NOT STARTED
- [ ] Virtual folder management
- [ ] Tag management
- [ ] Full-text search
- [ ] Bulk operations

### Phase 4: Preview & Permissions — NOT STARTED
- [ ] In-browser preview (PDF, images, text)
- [ ] Per-document access control
- [ ] Share links with expiry

---

## Docs (Knowledge Base) Module

### Phase 1: Core CRUD + Upload — DONE
- [x] Prisma models: DocPage, DocRevision
- [x] Page: `/africs/docs`
- [ ] Server actions — needs verification of completeness
- [ ] Single .md upload with frontmatter parsing — needs verification
- [ ] Markdown rendering — needs verification

### Phase 2: In-App Editor + Versioning — NOT STARTED
- [ ] Markdown editor component (split view)
- [ ] Save flow with revision creation
- [ ] Version history panel
- [ ] Restore from revision

### Phase 3: Docs Site Layout — NOT STARTED
- [ ] Sidebar navigation tree
- [ ] Breadcrumb navigation
- [ ] Table of contents (auto from headings)
- [ ] Search across pages
- [ ] Previous/Next navigation

### Phase 4: Bulk Upload + Management — NOT STARTED
- [ ] Zipped folder upload
- [ ] Drag-and-drop reordering
- [ ] Bulk publish/unpublish/archive
- [ ] Category management

### Phase 5: Polish — NOT STARTED
- [ ] Full-text search with highlighting
- [ ] Diff view between revisions
- [ ] Print-friendly layout
- [ ] Export as PDF

---

## Platform Shell & Core

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
- [x] Settings pages

### HR Module — Phase 1 DONE, Phase 2 DONE
- [x] Dynamic form builder
- [x] Employee profiles
- [x] Employee status tracking (active, on_leave with type, suspended, terminated, resigned)
- [x] Staff ID card and Business card (front + back, HTML preview + PDF)
- [x] Employee profile PDF export
- [x] TIN, citizenship, searchable country dropdown

### Timesheets — DONE
- [x] Prisma models: Timesheet, TimesheetEntry (with relations on User, Tenant, Employee, Project)
- [x] Server actions: getTimesheets, getTimesheet, getTimesheetByWeek, getTimesheetStats, getTeamTimesheets, createTimesheet, saveTimesheetEntries, submitTimesheet, approveTimesheet, rejectTimesheet, reopenTimesheet, deleteTimesheet
- [x] Constants: `src/lib/timesheet-constants.ts` — TIMESHEET_CATEGORIES, TIMESHEET_STATUSES, getWeekStart, getWeekDates, formatWeekRange, toISODate
- [x] Components: TimesheetStatusBadge, TimesheetCategoryBadge, TimesheetStatsCards, TimesheetListTable, TimesheetGrid, TimesheetActions, TimesheetDetailCard, NewTimesheetForm
- [x] Pages: `/africs/hr/timesheets`, `/africs/hr/timesheets/new`, `/africs/hr/timesheets/[id]`, `/africs/hr/timesheets/[id]/edit`
- [x] Workflow: draft → submitted → approved/rejected (rejected can be reopened to draft)

### Bills & Vendors (Accounts Payable) — DONE
- [x] Prisma models: Vendor, Bill, BillPayment, BillSettings
- [x] Server actions: getVendors, getVendor, createVendor, updateVendor, deactivateVendor, reactivateVendor; getBills, getBill, getBillStats, getBillsForVendor, createBill, updateBill, approveBill, recordBillPayment, deleteBillPayment, voidBill, deleteBill
- [x] Constants: `src/lib/bill-constants.ts` — PAYMENT_TERMS, BILL_PAYMENT_METHODS, BILL_STATUSES, VENDOR_STATUSES
- [x] Components: BillStatusBadge, BillStatsCards, BillListTable, BillDetailCard, BillActions, BillForm, BillPaymentDialog, BillPaymentHistory, VendorForm, VendorDetailCard, VendorListTable
- [x] Pages: `/africs/accounting/vendors`, `/africs/accounting/vendors/new`, `/africs/accounting/vendors/[id]`, `/africs/accounting/vendors/[id]/edit`; `/africs/accounting/bills`, `/africs/accounting/bills/new`, `/africs/accounting/bills/[id]`, `/africs/accounting/bills/[id]/edit`
- [x] Seed: `prisma/seed-bills.ts` (5 vendors, 9 bills in various statuses)

### Expenses — DONE
- [x] Prisma models: ExpenseCategory, Expense
- [x] Server actions: getExpenses, getExpense, getExpenseStats, getExpenseCategories, createExpense, updateExpense, submitExpense, approveExpense, rejectExpense, markReimbursed, deleteExpense
- [x] Constants: `src/lib/expense-constants.ts` — EXPENSE_CATEGORIES, EXPENSE_STATUSES, ExpenseStatus
- [x] Components: ExpenseStatusBadge, ExpenseCategoryBadge, ExpenseStatsCards, ExpenseListTable, ExpenseDetailCard, ExpenseActions, ExpenseForm
- [x] Pages: `/africs/accounting/expenses`, `/africs/accounting/expenses/new`, `/africs/accounting/expenses/[id]`, `/africs/accounting/expenses/[id]/edit`
- [x] Seed: `prisma/seed-expenses.ts`

### Payroll — DONE
- [x] Prisma models: PayrollRun, Payslip
- [x] Server actions: getPayrollRuns, getPayrollRun, getPayslip, getPayslipsForEmployee, getPayrollStats, createPayrollRun, updatePayslip, processPayrollRun, markPayrollPaid, deletePayrollRun
- [x] Components: PayrollStatusBadge, PayrollRunSummary, PayrollRunActions, PayrollRunList, PayrollRunForm, PayslipTable, PayslipEditDialog, PayslipDetailCard, PayslipHistory, PayslipPdf
- [x] Pages: `/africs/accounting/payroll`, `/africs/accounting/payroll/new`, `/africs/accounting/payroll/[id]`, `/africs/accounting/payroll/[id]/[payslipId]`
- [x] API route: `/api/payroll/[runId]/payslip/[payslipId]/pdf`
- [x] Employee detail "Payslips" tab with payslip history

### Leave Management — DONE
- [x] Prisma models: LeaveBalance, LeaveRequest
- [x] Server actions: getLeaveBalances, getAllLeaveBalances, upsertLeaveBalance, bulkAllocateLeaveBalances, getLeaveRequests, createLeaveRequest, reviewLeaveRequest, cancelLeaveRequest, getLeaveDashboardStats, getLeaveCalendarData, syncEmployeeLeaveStatus
- [x] Components: LeaveStatusBadge, LeaveTypeBadge, LeaveRequestForm, LeaveRequestTable, LeaveReviewDialog, LeaveBalanceTable, LeaveBulkAllocateDialog, LeaveDashboardCards
- [x] Pages: `/africs/hr/time-off`, `/africs/hr/time-off/requests/new`, `/africs/hr/time-off/balances`

---

## Cross-Cutting TODO

- [ ] Notification integration for invoicing events
- [ ] Email service setup (Resend or similar)
- [ ] Production file storage (Vercel Blob / S3) — currently local filesystem
- [ ] Verify all public/shared routes work without auth
- [ ] End-to-end testing
- [ ] Mobile responsiveness audit
