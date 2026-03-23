# AfricsCore

A multi-tenant business management platform built for owners who run their own company and manage client businesses from a single workspace. Built with Next.js 16, PostgreSQL, and a modern TypeScript stack.

---

## Overview

AfricsCore has two primary contexts:

- **Owner workspace** (`/africs/*`) — full ERP for your own business: invoicing, projects, HR, accounting, CRM, fleet, and more.
- **Client workspaces** (`/clients/[slug]/*`) — scoped workspace per client company with projects, invoices, HR forms, and settings.

A company switcher in the sidebar lets you move between contexts instantly. All data is strictly scoped by tenant.

---

## Features

### Invoicing
- Create, edit, send, and void invoices with full lifecycle management (`draft → sent → viewed → paid`)
- **Proforma invoices** with a separate numbering prefix and their own flow (`draft → sent → accepted → converted / expired`)
- Convert proforma invoices to standard invoices with one click
- **PDF generation** for invoices and receipts using `@react-pdf/renderer`
- **Shareable invoice links** — public client view with status banners, no login required
- Record payments with method, reference number, and date; partial payment support
- Payment receipts — downloadable PDF and in-app receipt preview
- **Document branding** — upload a company logo (SVG/PNG), set an accent colour; applied consistently across all invoices, proformas, and receipts
- Recurring invoice settings
- Aging report and revenue chart
- Invoice email composition with Resend integration support
- Per-invoice activity feed tracking every status change and payment

### Project Management
- Projects scoped to your business or to individual client companies
- **Kanban board** with drag-and-drop task cards and custom status columns
- **Timeline / Gantt** view with task bars and date ranges
- **Calendar view** for task due dates
- Task detail sheet: description, priority, assignees, due date, labels, subtasks
- **Checklists** — multiple checklists per task with progress tracking
- **Comments** on tasks
- **Task dependencies** with circular dependency prevention
- **Time tracking** — log time per task, view per-project time reports
- **Milestones** with progress tracking
- **Project activity feed** — auto-recorded on status changes, membership, task updates
- **Bulk actions** — update status/priority, assign, delete, or set due dates on multiple tasks at once
- **Project templates** — save any project as a template and spin up new projects from it
- **Cross-project dashboard** and profitability reports

### HR
- Employee profiles
- Dynamic form builder for custom HR data collection

### Company & Settings
- Multi-company support with role-based access (`company_admin`, `manager`, `staff`)
- Per-module permissions stored as JSON per user-tenant link
- **Branding settings** — logo upload, accent colour picker, document defaults
- **Invoice settings** — prefix, next number, proforma prefix, tax rate, bank details, email templates
- **SMTP integration** — configure your own mail server with TLS/SSL support
- **Communications settings** — email provider selection (console / Resend / SMTP)
- Statutory registers

### Platform
- Light/dark theme toggle (defaults to dark)
- Persistent workspace switcher (Zustand, localStorage)
- Super Admin role bypassing tenant scoping

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Auth.js v5 (next-auth@beta) — credentials + JWT |
| UI | shadcn/ui (base-nova), Base UI, Lucide icons |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| State | Zustand (persisted) |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Package manager | pnpm |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Public: sign-in, sign-up
│   ├── (platform)/                 # Protected: full app
│   │   ├── africs/                 # Owner business workspace
│   │   │   ├── accounting/         # Invoices, payments, receipts, bills, expenses
│   │   │   ├── projects/           # Project management
│   │   │   ├── hr/                 # HR module
│   │   │   ├── company/            # Departments, locations, statutory registers
│   │   │   ├── crm/                # Contacts, appointments
│   │   │   ├── settings/           # Branding, invoices, communications, integrations
│   │   │   └── ...                 # Fleet, marketing, sales, services, etc.
│   │   ├── clients/[slug]/         # Per-client scoped workspace
│   │   └── dashboard/              # Super Admin overview
│   ├── api/
│   │   ├── auth/[...nextauth]/     # Auth.js route handler
│   │   └── invoices/[id]/
│   │       ├── pdf/                # Invoice PDF download
│   │       └── receipt/            # Receipt PDF download
│   └── view/invoice/[token]/       # Public shareable invoice view
├── components/
│   ├── invoices/                   # All invoice UI components + PDF templates
│   ├── projects/                   # All project/task UI components
│   ├── settings/                   # Branding, SMTP, invoice settings forms
│   ├── layout/                     # Sidebar, TopBar
│   ├── providers/                  # Theme, Session, AuthGuard
│   └── ui/                         # shadcn/ui base components
├── lib/
│   ├── actions/                    # All server actions (data layer)
│   ├── auth.ts                     # Auth.js config
│   ├── prisma.ts                   # Prisma client singleton
│   ├── email.ts                    # Email sending
│   └── stores/                     # Zustand stores
└── proxy.ts                        # Route protection (Next.js 16 middleware)
prisma/
├── schema.prisma                   # Full database schema
├── migrations/                     # Migration history (15 migrations)
└── prisma.config.ts                # Prisma 7 config (migration URL)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### 1. Clone and install

```bash
git clone https://github.com/musaajallo/bizman.git
cd bizman
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Auth
AUTH_SECRET=          # Generate with: npx auth secret
AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bizman
```

Also create a `.env` file (used by the Prisma CLI for migrations):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bizman
```

### 3. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account. The first tenant you create is treated as the owner business.

---

## Database

Schema is managed with Prisma 7. Key models:

| Model | Purpose |
|---|---|
| `User` | Platform users |
| `Tenant` | Companies (owner or client) |
| `TenantUser` | User ↔ Tenant link with role + per-module permissions |
| `Project` | Projects scoped to a tenant |
| `Task` | Tasks with subtasks, dependencies, time tracking |
| `Invoice` | Standard invoices and proformas |
| `InvoicePayment` | Per-payment records |
| `InvoiceSettings` | Per-tenant numbering, branding, tax, bank details |
| `SmtpSettings` | Per-tenant custom SMTP configuration |
| `Document` | File attachments with versioning |
| `DocPage` | Internal knowledge base pages with revision history |

### Common commands

```bash
npx prisma migrate dev          # Create and apply a new migration
npx prisma generate             # Regenerate Prisma client after schema changes
npx prisma studio               # Visual database browser at localhost:5555
```

---

## Key Patterns

**Server actions over API routes** — all data mutations go through `src/lib/actions/*.ts` server actions. API routes exist only for streaming binary responses (PDF downloads).

**Tenant scoping** — every data query includes a `tenantId` filter. `User.isSuperAdmin` bypasses this for platform-level operations.

**Auth flow** — Auth.js credentials provider with bcrypt password hashing. Sessions use JWT strategy. Route protection runs in `src/proxy.ts` (Next.js 16 middleware). A client-side `AuthGuard` component provides a fallback for late hydration.

**Logo storage** — company logos are uploaded as SVG/PNG, converted to base64 data URLs client-side, and stored in the `logoUrl` TEXT field on `Tenant` and `InvoiceSettings`. The fallback chain across all document surfaces is `InvoiceSettings.logoUrl → Tenant.logoUrl`.

**PDF generation** — invoice and receipt PDFs are rendered server-side using `@react-pdf/renderer` in API route handlers (`/api/invoices/[id]/pdf` and `/api/invoices/[id]/receipt`). The same accent colour and logo fallback chain applies.

**Workspace switching** — the active tenant context is persisted to localStorage via a Zustand store (`bizman-workspace`). The sidebar company switcher updates this store and navigates to the appropriate route prefix (`/africs/*` or `/clients/[slug]/*`).

---

## Roadmap

- [ ] Client portal with online payments (Stripe / Paystack)
- [ ] Credit notes
- [ ] Email sending via Resend (SMTP config UI is complete; transport wiring pending)
- [ ] Production file storage (Vercel Blob / S3) — logo currently stored as base64 in DB
- [ ] Documents module — upload, versioning, folder organisation
- [ ] Knowledge base editor with Markdown and revision history
- [ ] Multi-currency exchange rates
- [ ] Tax profiles (VAT / GST with multiple rates)
- [ ] Overdue invoice automation (scheduled reminders)
- [ ] Mobile responsiveness audit
- [ ] End-to-end test suite

---

## License

Private — all rights reserved.
