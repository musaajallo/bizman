# AfricsCore — Project Management Module Plan

## Context

AfricsCore needs a project management module so the owner (Africs) can track projects for their own business and for client companies. Currently only HR/Forms modules exist. The sidebar already has "Projects" nav links wired to `/africs/projects` and `/clients/[slug]/projects` — but no pages or data models exist yet.

The design is inspired by ClickUp's hierarchy and task management, adapted for a small-to-medium business context. The user specifically requires: comprehensive project details, entity assignment (individual person OR company), internal team assignment, start/end dates with rolling option, and full task management within projects.

---

## Data Model

### New Models (add to `prisma/schema.prisma`)

**Project** — the comprehensive center of the module:

```
Project
  id            String    cuid
  tenantId      String    → Tenant (always the owner business, Africs)

  # Core
  name          String
  slug          String    (unique within tenant)
  description   String?   @db.Text
  status        String    default "not_started"  (not_started | in_progress | on_hold | completed | cancelled)
  priority      String    default "medium"       (low | medium | high | urgent)
  type          String    default "client"       (client | internal | retainer)

  # Dates
  startDate     DateTime?
  endDate       DateTime?
  isRolling     Boolean   default false   (true = ongoing, no fixed end)

  # Entity Assignment — WHO is this project FOR?
  clientTenantId String?  → Tenant  (project for a client company)
  contactName    String?             (project for an individual — not a tenant)
  contactEmail   String?
  contactPhone   String?

  # Budget & Billing
  billingType    String?  (fixed | hourly | retainer | pro_bono)
  budgetAmount   Decimal? @db.Decimal(12,2)
  budgetCurrency String?  (no default — user must select)
  hourlyRate     Decimal? @db.Decimal(8,2)

  # Categorization
  category       String?  (e.g. "Web Development", "Consulting")
  tags           String[]

  # Progress
  progress       Int      default 0  (0–100, auto-calculated or manual)

  # Notes
  notes          String?  @db.Text

  # Metadata
  createdById    String   → User
  createdAt      DateTime
  updatedAt      DateTime
  archivedAt     DateTime?

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([clientTenantId])
```

**ProjectMember** — who from Africs is assigned to a project:

```
ProjectMember
  id         String   cuid
  projectId  String   → Project
  userId     String   → User
  role       String   default "member"  (lead | member | reviewer)
  createdAt  DateTime

  @@unique([projectId, userId])
```

**ProjectStatus** — customizable task statuses per project:

```
ProjectStatus
  id        String   cuid
  projectId String   → Project
  name      String   (e.g. "To Do", "In Progress", "Review", "Done")
  color     String   default "#6B7280"
  group     String   (not_started | active | done | closed)
  order     Int
  isDefault Boolean  default false

  @@unique([projectId, name])
  @@index([projectId, order])
```

Default statuses seeded on project creation: To Do (not_started, 0, default), In Progress (active, 1), Review (active, 2), Done (done, 3).

**Task** — self-referencing for subtasks:

```
Task
  id             String    cuid
  projectId      String    → Project
  statusId       String    → ProjectStatus
  parentId       String?   → Task (null = top-level, set = subtask)

  title          String
  description    String?   @db.Text
  priority       String    default "medium"  (none | low | medium | high | urgent)
  order          Int       default 0

  assigneeId     String?   → User
  startDate      DateTime?
  dueDate        DateTime?
  completedAt    DateTime?

  estimateMinutes Int?
  loggedMinutes   Int      default 0

  createdById    String    → User
  createdAt      DateTime
  updatedAt      DateTime

  @@index([projectId, statusId, order])
  @@index([assigneeId])
  @@index([parentId])
```

**TaskComment** — threaded comments:

```
TaskComment
  id        String   cuid
  taskId    String   → Task
  authorId  String   → User
  content   String   @db.Text
  parentId  String?  → TaskComment (threaded replies)
  createdAt DateTime
  updatedAt DateTime
```

**TaskChecklist / TaskChecklistItem** — lightweight checklists within tasks:

```
TaskChecklist
  id     String  cuid
  taskId String  → Task
  title  String  default "Checklist"
  order  Int     default 0

TaskChecklistItem
  id          String   cuid
  checklistId String   → TaskChecklist
  title       String
  isComplete  Boolean  default false
  order       Int      default 0
  assigneeId  String?  → User
```

**Milestone** — key deliverables within a project:

```
Milestone
  id        String    cuid
  projectId String    → Project
  name      String
  dueDate   DateTime?
  completed Boolean   default false
  order     Int       default 0
  createdAt DateTime
```

**ProjectActivity** — auto-recorded activity log:

```
ProjectActivity
  id        String   cuid
  projectId String   → Project
  actorId   String   → User
  action    String   (created_project | updated_status | added_member | created_task | completed_task | etc.)
  details   Json?    ({ field, from, to })
  createdAt DateTime
```

### Relations to add on existing models

**Tenant** — add:
```
projects        Project[]
clientProjects  Project[]  @relation("ProjectClient")
```

**User** — add:
```
createdProjects    Project[]
projectMembers     ProjectMember[]
assignedTasks      Task[]              @relation("TaskAssignee")
createdTasks       Task[]              @relation("TaskCreator")
taskComments       TaskComment[]
checklistItems     TaskChecklistItem[]
projectActivities  ProjectActivity[]
```

### Tenant scoping logic

Projects always have `tenantId` = the owner business (Africs). The `clientTenantId` identifies which client company the project is for. This means:
- `/africs/projects` → query `WHERE tenantId = <owner>` (shows ALL projects)
- `/clients/[slug]/projects` → query `WHERE clientTenantId = <that client's id>`

This differs from HR data (scoped per-tenant) because projects are owned by the service provider, not the client.

---

## Implementation Phases

### Phase 1: Core Project CRUD + Task List View
**Goal**: User can create projects with full details, assign to clients/individuals, add team members, create and manage tasks in a list view.

Files to create/modify:
- `prisma/schema.prisma` — add Project, ProjectMember, ProjectStatus, Task models + User/Tenant relations
- `src/lib/actions/projects.ts` — getProjects, getProjectBySlug, createProject (with default status seeding), updateProject, archiveProject, getProjectMembers, addProjectMember, removeProjectMember, getProjectStats
- `src/lib/actions/tasks.ts` — getTasksByProject, createTask, updateTask, deleteTask, updateTaskStatus, reorderTasks
- `src/components/projects/status-badge.tsx`
- `src/components/projects/priority-indicator.tsx`
- `src/components/projects/project-card.tsx`
- `src/components/projects/project-form.tsx` — comprehensive create/edit form
- `src/components/projects/project-progress.tsx`
- `src/components/projects/member-avatar-group.tsx`
- `src/components/projects/task-row.tsx`
- `src/components/projects/quick-add-task.tsx`
- `src/components/projects/view-switcher.tsx`
- `src/components/projects/filter-bar.tsx`
- `src/app/(platform)/africs/projects/page.tsx` — all projects list
- `src/app/(platform)/africs/projects/new/page.tsx` — create project
- `src/app/(platform)/africs/projects/[projectSlug]/page.tsx` — project detail with task list
- `src/app/(platform)/africs/projects/[projectSlug]/settings/page.tsx` — edit project details, manage members, customize statuses
- `src/app/(platform)/clients/[slug]/projects/page.tsx` — client-scoped project list
- `src/app/(platform)/clients/[slug]/projects/new/page.tsx` — create project pre-scoped to client
- `src/app/(platform)/clients/[slug]/projects/[projectSlug]/page.tsx` — project detail
- `src/app/(platform)/clients/[slug]/projects/[projectSlug]/settings/page.tsx`
- Update `enabledModules` default to include "projects"

### Phase 2: Board View, Task Detail, Comments, Checklists
- `prisma/schema.prisma` — add TaskComment, TaskChecklist, TaskChecklistItem
- `src/lib/actions/task-comments.ts`
- `src/lib/actions/task-checklists.ts`
- `src/components/projects/task-card.tsx` — compact card for board columns
- `src/components/projects/task-detail-sheet.tsx` — slide-over panel with full task editing, comments, checklists, subtasks
- `src/components/projects/checklist.tsx`
- `src/components/projects/comment-feed.tsx`
- `src/app/(platform)/africs/projects/[projectSlug]/board/page.tsx` — Kanban view
- `src/app/(platform)/clients/[slug]/projects/[projectSlug]/board/page.tsx`
- Drag-and-drop for board columns (native DnD or lightweight library)
- Subtask support in task detail
- Custom status management UI (add/edit/reorder/color per project)

### Phase 3: Milestones, Activity Log, Calendar, Dashboard
- `prisma/schema.prisma` — add Milestone, ProjectActivity
- `src/lib/actions/milestones.ts`
- `src/components/projects/milestone-list.tsx`
- `src/components/projects/activity-feed.tsx`
- Activity auto-recording on status changes, member additions, task updates
- Calendar view pages (monthly grid with task chips by due date)
- Project overview dashboard: progress chart, task distribution by status, upcoming deadlines, overdue count
- Integration with existing Notification model

### Phase 4: Advanced Features (Future)
- Timeline/Gantt view
- Task dependencies (blocking/blocked-by)
- Time tracking (log time entries against tasks)
- Project templates (save structure, create new projects from it)
- Bulk operations (multi-select, bulk status/assign)
- Reporting: project profitability, cross-project dashboard

---

## Route Structure

```
src/app/(platform)/
├── africs/projects/
│   ├── page.tsx                        # All projects list
│   ├── new/page.tsx                    # Create project form
│   └── [projectSlug]/
│       ├── page.tsx                    # Project detail — task list (default view)
│       ├── board/page.tsx              # Kanban view (Phase 2)
│       ├── calendar/page.tsx           # Calendar view (Phase 3)
│       └── settings/page.tsx           # Project settings, members, statuses
│
├── clients/[slug]/projects/
│   ├── page.tsx                        # Projects for this client
│   ├── new/page.tsx                    # Create project (pre-scoped to client)
│   └── [projectSlug]/
│       ├── page.tsx                    # Project detail — task list
│       ├── board/page.tsx              # Kanban view (Phase 2)
│       ├── calendar/page.tsx           # Calendar view (Phase 3)
│       └── settings/page.tsx           # Project settings
```

Task detail uses a **Sheet** (slide-over panel) triggered from the list/board view, not a separate route. This keeps the user in the project context while viewing full task details. URL can use `?task=<id>` query param for shareability.

---

## Key UI Patterns

**Project Form** (create/edit) — grouped in Card sections:
1. Basic Info: name, description, type (select), category (input)
2. Dates: start date, end date, rolling toggle (Switch)
3. Client Assignment: toggle "Company" vs "Individual" → shows either tenant selector (existing Command/Combobox) or contact name/email/phone fields
4. Team: multi-select project members from owner tenant users, with role assignment
5. Budget: billing type (select), amount, currency, hourly rate
6. Tags: freeform tag input
7. Notes: textarea for additional details

**Projects List** — Card grid (like clients page) or Table view, with filters for status, type, client, priority. Each card shows: name, client, status badge, priority, progress bar, member avatars, due date.

**Task List View** — Table inside Card (like HR page pattern). Columns: title, status (badge), priority (icon), assignee (avatar), due date, estimate. Quick-add row at top for rapid task creation.

**Board View** — CSS grid columns representing ProjectStatus entries. Task cards within columns. Drag between columns changes status.

**View Switcher** — Button group in TopBar with List/Board/Calendar icons. Selected view = current route segment.

---

## Shared Components (`src/components/projects/`)

| Component | Purpose |
|-----------|---------|
| `status-badge.tsx` | Colored badge from ProjectStatus (name + color) |
| `priority-indicator.tsx` | Icon + color per priority level |
| `project-card.tsx` | Summary card for projects list |
| `project-form.tsx` | Full create/edit form with all sections |
| `project-progress.tsx` | Thin progress bar (0-100%) |
| `member-avatar-group.tsx` | Stacked avatars with +N overflow |
| `view-switcher.tsx` | List/Board/Calendar toggle |
| `filter-bar.tsx` | Reusable filter strip (status, priority, assignee, date) |
| `task-row.tsx` | Table row with inline status/priority/assignee editing |
| `task-card.tsx` | Compact card for board columns |
| `task-detail-sheet.tsx` | Sheet with full task editing, comments, checklists |
| `quick-add-task.tsx` | Inline input for rapid task creation |
| `checklist.tsx` | Checklist CRUD within task detail |
| `comment-feed.tsx` | Threaded comments within task detail |
| `milestone-list.tsx` | Milestone management within project settings |
| `activity-feed.tsx` | Project activity timeline |

---

## Server Actions (`src/lib/actions/`)

**projects.ts:**
- `getProjects(tenantId, filters?)` — list with status/type/client filters
- `getProjectBySlug(tenantId, slug)` — single project with members, task counts
- `getProjectsForClient(clientTenantId)` — scoped to a client
- `createProject(formData)` — creates project + seeds default statuses + adds creator as lead
- `updateProject(projectId, formData)` — update any field
- `archiveProject(projectId)` — sets archivedAt
- `getProjectMembers(projectId)`
- `addProjectMember(projectId, userId, role)`
- `removeProjectMember(projectId, userId)`
- `getProjectStats(projectId)` — task counts by status group, progress, overdue count

**tasks.ts:**
- `getTasksByProject(projectId, filters?)` — with status/assignee/priority filters
- `createTask(formData)` — create task with default status
- `updateTask(taskId, formData)` — update any field
- `deleteTask(taskId)`
- `updateTaskStatus(taskId, statusId)` — optimized for drag-and-drop
- `reorderTasks(statusId, orderedTaskIds[])` — batch reorder for DnD
- `getTaskDetail(taskId)` — with subtasks, comments, checklists

All follow existing pattern: `auth()` guard → FormData or params → Prisma query → `revalidatePath` → return `{error}` or `{success}`.

---

---

## Phase 5: Milestones, Payment Triggers & Task Hierarchy

### Overview

Milestones become first-class containers. Tasks (and their sub-tasks) attach to a milestone, making the project structure three levels deep:

```
Project
  └── Milestone  (e.g. "Phase 1 — Discovery")
        ├── Task  (e.g. "Stakeholder interviews")
        │     └── Sub-task  (e.g. "Prepare interview questions")
        └── Task  (e.g. "Deliver findings report")
```

Milestones without a payment trigger behave as pure organisational groupings. With a trigger, one click generates a pre-filled invoice.

### Schema Changes

```prisma
// Enhance existing Milestone model
model Milestone {
  id            String    @id @default(cuid())
  projectId     String
  name          String
  description   String?   @db.Text
  dueDate       DateTime?
  status        String    @default("not_started")
  // not_started | in_progress | completed | delayed
  completedAt   DateTime?
  order         Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks         Task[]    // tasks grouped under this milestone
  payment       MilestonePayment?
  delays        TaskDelay[]
}

// Add milestoneId to Task (nullable — task may or may not belong to a milestone)
// ALTER: Task.milestoneId String? → Milestone

// New: payment trigger per milestone
model MilestonePayment {
  id              String    @id @default(cuid())
  milestoneId     String    @unique
  amount          Decimal   @db.Decimal(12, 2)
  currency        String    @default("USD")
  description     String?   // Pre-fills invoice line item description
  triggerType     String    @default("manual")  // "manual" | "on_completion"
  invoiceId       String?   @unique             // Set once triggered; prevents double-trigger
  triggeredAt     DateTime?
  triggeredById   String?

  milestone       Milestone @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  invoice         Invoice?  @relation(fields: [invoiceId], references: [id])
}
```

### Payment Trigger Logic

When a user clicks "Trigger Payment" on a milestone:

1. Guard: check `MilestonePayment.invoiceId == null` (or linked invoice is voided) — prevent double invoicing
2. Call `createInvoice` internally with:
   - `clientTenantId` / `clientName` from the project
   - `projectId` linked
   - `referenceNumber` = milestone name
   - Line item: `description = payment.description ?? milestone.name`, `quantity = 1`, `unitPrice = payment.amount`
   - `currency` from payment trigger
3. Set `MilestonePayment.invoiceId = newInvoice.id`, `triggeredAt = now()`, `triggeredById`
4. Milestone card updates to show "Invoiced" badge with link to invoice

**Re-triggering:** Only allowed if the linked invoice has been voided. Guard check:
```
allowed = invoiceId == null || linkedInvoice.status == "void"
```

### UI

**Milestone card** (in project task list or dedicated milestones tab):
```
┌─────────────────────────────────────────────────────────┐
│  ● Phase 1 — Discovery          [In Progress]  Due Jul 5│
│  ─────────────────────────────────────────────────────  │
│  3 of 5 tasks complete  ████████░░  60%                 │
│                                                         │
│  Payment: $4,500 USD                [Trigger Invoice →] │
│  or if triggered:     Invoice #INV-042  [Paid ✓]        │
└─────────────────────────────────────────────────────────┘
```

Tasks are shown indented under their milestone. Tasks with no milestone appear in an "Unassigned" section at the bottom.

---

## Phase 6: Delay Tracking & Client Communications Log

### Overview

Two parallel audit trails attached to tasks and milestones:

- **Delay log** — structured record of every time a due date slips, with reason and impact
- **Communications log** — every client interaction (email, call, meeting, message) logged against a task or milestone

Both are exportable. The combination gives a complete project paper trail — critical for dispute resolution, billing justification, and client reporting.

### Schema

```prisma
model TaskDelay {
  id              String    @id @default(cuid())
  projectId       String
  taskId          String?
  milestoneId     String?
  originalDueDate DateTime
  revisedDueDate  DateTime
  delayDays       Int                           // computed: revisedDueDate - originalDueDate in days
  reason          String    @db.Text            // Why the delay happened
  impact          String?   @db.Text            // What this affects downstream
  clientNotified  Boolean   @default(false)
  recordedById    String
  createdAt       DateTime  @default(now())

  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task            Task?     @relation(fields: [taskId], references: [id])
  milestone       Milestone? @relation(fields: [milestoneId], references: [id])
  recordedBy      User      @relation(fields: [recordedById], references: [id])

  @@index([projectId])
  @@index([taskId])
}

model ProjectCommunication {
  id              String    @id @default(cuid())
  projectId       String
  taskId          String?                       // Optional: attach to a specific task
  milestoneId     String?                       // Optional: attach to a milestone
  direction       String                        // "inbound" | "outbound"
  channel         String                        // "email" | "phone" | "meeting" | "message" | "portal" | "other"
  subject         String
  content         String    @db.Text
  attachmentUrls  String[]                      // Links to uploaded files if any
  contactName     String?                       // Client contact who communicated
  contactEmail    String?
  recordedById    String
  communicatedAt  DateTime                      // When the actual communication happened
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task            Task?     @relation(fields: [taskId], references: [id])
  milestone       Milestone? @relation(fields: [milestoneId], references: [id])
  recordedBy      User      @relation(fields: [recordedById], references: [id])

  @@index([projectId, communicatedAt])
  @@index([taskId])
}
```

### Delay Tracking UI

**Log delay dialog** (triggered from task detail or milestone card):
- Original due date (pre-filled from task/milestone current due date, read-only)
- New due date (date picker)
- Delay days (auto-computed, shown as "X days")
- Reason (textarea, required)
- Impact (textarea, optional — what downstream work is affected)
- "Client notified?" toggle

**Task detail — Delays tab:**
- Timeline of all delays logged for this task
- Each entry: date logged, original → revised due date, delay days badge, reason, impact, who logged it
- "Log Delay" button

**Project delays page** (`/africs/projects/[slug]/delays`):
- Table of all delays across the project, grouped by milestone
- Columns: Task / Milestone, Original Due, Revised Due, Days Lost, Reason, Client Notified, Logged By, Date
- Filter by: milestone, date range, client-notified status
- Summary row: total days lost across project

### Communications Log UI

**Log communication dialog** (from task detail, milestone card, or project comms tab):
- Direction: Inbound / Outbound toggle
- Channel: Email / Phone / Meeting / Message / Portal / Other
- Date & time (defaults to now)
- Contact name + email (pre-filled from project client if available)
- Subject
- Content (textarea)
- Attachment URLs (freeform, or future: file upload)

**Task detail — Communications tab:**
- Chronological list of all comms for this task
- Each entry: direction arrow (↙ inbound / ↗ outbound), channel icon, date, subject, contact, recorded by
- Expandable to show full content

**Project communications page** (`/africs/projects/[slug]/communications`):
- Full log across all tasks and milestones
- Filter by: channel, direction, task/milestone, contact, date range
- Search by subject or content keyword
- "Log Communication" button (choose which task/milestone to attach to)

### Export

Both logs are exported from the project-level pages.

**Delay log export (CSV):**
```
Project, Milestone, Task, Original Due, Revised Due, Days Lost, Reason, Impact, Client Notified, Logged By, Date Logged
```

**Delay log export (PDF):**
- Header: Project name, client, export date
- Summary: total delays, total days lost, % of tasks affected
- Table grouped by milestone, sorted by date

**Communications log export (CSV):**
```
Project, Milestone, Task, Direction, Channel, Date, Subject, Contact Name, Contact Email, Content, Recorded By
```

**Communications log export (PDF):**
- Header: Project name, client, date range
- Entries grouped by task/milestone, sorted chronologically
- Each entry shows direction, channel, date, subject, and full content

**Combined export (ZIP):**
- `delays.csv`, `delays.pdf`, `communications.csv`, `communications.pdf` in a single download

### New Pages

```
/africs/projects/[slug]/delays              Project delay log
/africs/projects/[slug]/communications      Project communications log
```

Both pages are also accessible from the project's view switcher / tab bar. The export buttons live at the top-right of each page alongside the "Log ..." action button.

---

## Verification

After Phase 1 implementation:
1. Run `npx prisma migrate dev` — verify migration applies cleanly
2. Run `pnpm build` — verify no type errors
3. Navigate to `/africs/projects` — should show empty state with "New Project" button
4. Create a project with all fields filled → verify it appears in the list
5. Navigate to `/africs/projects/[slug]` — verify project detail loads with empty task list
6. Create tasks via quick-add → verify they appear in the list
7. Change task status/priority inline → verify updates persist
8. Add project members → verify they appear in project settings
9. Navigate to `/clients/[slug]/projects` → verify only projects for that client show
10. Create a project from client context → verify `clientTenantId` is pre-set
