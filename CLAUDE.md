# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AfricsCore is a multi-tenant business management platform. A single owner uses it to manage their own business (ERP) and client companies (managed services). Built with Next.js 16, PostgreSQL (Prisma 7), Auth.js, and shadcn/ui.

## Commands

```bash
pnpm dev                    # Start Next.js dev server (Turbopack)
pnpm build                  # Production build
pnpm lint                   # ESLint
npx prisma migrate dev      # Create/apply database migrations
npx prisma generate         # Regenerate Prisma client after schema changes
npx prisma studio           # Visual database browser
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** PostgreSQL via Prisma 7 (with `@prisma/adapter-pg`)
- **Auth:** Auth.js v5 (next-auth@beta) with credentials provider, JWT sessions
- **UI:** shadcn/ui (base-nova style, neutral base, CSS variables), Lucide icons, Framer Motion
- **Forms:** React Hook Form + Zod
- **State:** Zustand (persisted workspace store)
- **Theming:** next-themes (light/dark toggle, default dark)
- **Package manager:** pnpm

### Prisma 7 Setup
- Schema: `prisma/schema.prisma` — no `url` in datasource block (Prisma 7 change)
- Config: `prisma.config.ts` — provides migration URL
- Client: `src/lib/prisma.ts` — uses `@prisma/adapter-pg` with `PrismaPg` adapter
- Migrations: `prisma/migrations/`

### Auth Flow
- Config: `src/lib/auth.ts` — NextAuth with credentials provider, PrismaAdapter, JWT strategy
- Route handler: `src/app/api/auth/[...nextauth]/route.ts`
- Server actions: `src/lib/actions/auth.ts` — sign-up (hashes password with bcrypt, creates user, auto-signs in)
- Proxy: `src/proxy.ts` — server-side route protection via `auth()` wrapper. Redirects unauthenticated users from protected routes to `/sign-in`, redirects authenticated users from auth routes to `/dashboard`
- AuthGuard: `src/components/providers/auth-guard.tsx` — client-side fallback using `useSession()`
- Sign-in uses `window.location.href` for hard navigation after auth (not `router.push`) to ensure server-side session is re-evaluated

### Multi-Tenancy Model
- `Tenant` table holds all companies; `isOwnerBusiness: true` marks the owner's company
- `TenantUser` links users to tenants with roles (`company_admin`, `manager`, `staff`) and per-module permissions (JSON)
- All data queries must be scoped by `tenantId`
- Super Admin (`User.isSuperAdmin`) bypasses tenant scoping

### Route Structure
```
src/app/
├── api/auth/[...nextauth]/    # Auth.js route handler
├── (auth)/                     # Public: custom sign-in/sign-up forms
│   ├── sign-in/[[...sign-in]]/
│   └── sign-up/[[...sign-up]]/
├── (platform)/                 # Protected: wrapped in AuthGuard + Sidebar
│   ├── dashboard/              # Super Admin platform overview
│   ├── my-business/            # Owner's business (ERP)
│   ├── clients/                # All client companies list
│   └── clients/[slug]/         # Per-client workspace
│       ├── dashboard/
│       ├── hr/
│       └── settings/
```

### Provider Stack (root layout)
`ThemeProvider` > `SessionProvider` > `TooltipProvider` > page content

### Workspace Switching
The sidebar has a company switcher. Active workspace is stored in Zustand (`useWorkspaceStore`, persisted to localStorage as `bizman-workspace`). Owner business (Africs) routes to `/africs/*`, client companies route to `/clients/[slug]/*`.

### Design System
- Light and dark themes with custom tokens in `globals.css`
- Dark: Background `#0F1117`, Primary `#4F6EF7`, Teal `#7CEFCF`
- Light: Background `#FAFBFE`, Primary `#4F6EF7`, Teal `#0D9488`
- Fonts: DM Sans (body, `--font-sans`), JetBrains Mono (code, `--font-mono`), Fraunces (display headings, `--font-display`)
- shadcn config: base-nova style, neutral base color, CSS variables, `@/` aliases

### Key Patterns
- `@/` path alias maps to `./src/*`
- shadcn components in `src/components/ui/`
- Layout components in `src/components/layout/`
- Providers in `src/components/providers/`
- Server actions in `src/lib/actions/`
- Use `cn()` from `@/lib/utils` for conditional class merging

## Environment Variables

Required in `.env.local`:
```
AUTH_SECRET=            # Generate with: npx auth secret
AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/bizman
```

Also needs `.env` with `DATABASE_URL` for Prisma CLI migrations.

## Model Usage

- **Planning**: Always use an Agent subagent with `model: "opus"` and `subagent_type: "Plan"` for architecture, design decisions, and implementation planning.
- **Coding**: Do all implementation work directly in the main conversation (Sonnet). Do not spawn coding subagents — write code inline.
- **Exploration**: Use Explore subagents (inherit main model) for codebase research.

## TODO Tracking

`docs/TODO.md` tracks implementation status for all modules. **Always update it when:**
- A new feature or task is added to the backlog — add it as `- [ ]`
- A feature or task is completed — check it off as `- [x]`
- A new phase or section is planned — add it to the appropriate module

## Phase 1 Scope

Current development phase covers: platform shell, auth, company management, branding customization, and HR module (dynamic form builder, employee profiles, PDF generation).
