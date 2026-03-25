import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WebsiteHeader } from "@/components/website/website-header";
import {
  Building2,
  Users,
  BarChart3,
  ShoppingCart,
  Package,
  Settings,
  Clock,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Documentation — AfricsCore",
};

export default async function DocsPage() {
  const session = await auth();
  if (!session) redirect("/sign-in?callbackUrl=/docs");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WebsiteHeader isSignedIn activePage="docs" />

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-10">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <link.icon className="h-3.5 w-3.5 shrink-0" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-16">
          {/* Overview */}
          <section id="overview">
            <h1 className="font-display text-3xl font-semibold">
              AfricsCore Documentation
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              AfricsCore is a multi-tenant business management platform. A
              single owner account manages their own business (ERP mode) and
              multiple client companies (managed services mode) from one
              interface.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLinks.map((ql) => (
                <a
                  key={ql.href}
                  href={ql.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <ql.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{ql.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </section>

          {/* Getting Started */}
          <section id="getting-started">
            <SectionHeading icon={Building2} title="Getting Started" />
            <Prose>
              <p>
                After signing in, you&apos;ll land on the platform dashboard.
                Use the company switcher in the sidebar to toggle between your
                own business (<strong>Africs</strong>) and any client companies
                you manage.
              </p>
            </Prose>
            <Steps
              steps={[
                {
                  title: "Sign in to your account",
                  description:
                    "Use your email and password on the sign-in page. You'll be redirected to the main dashboard.",
                },
                {
                  title: "Select a workspace",
                  description:
                    'Use the company switcher at the top of the sidebar. "Africs" is your own business; client companies appear below it.',
                },
                {
                  title: "Navigate to a module",
                  description:
                    "Each workspace exposes the same set of modules: HR, Accounting, Procurement, Assets, and Operations.",
                },
              ]}
            />
          </section>

          {/* HR */}
          <section id="hr">
            <SectionHeading icon={Users} title="Human Resources" />
            <Prose>
              <p>
                The HR module covers the full employee lifecycle — from hiring
                through to performance management. It is divided into several
                sub-modules accessible from the HR sidebar section.
              </p>
            </Prose>
            <FeatureTable
              rows={[
                {
                  feature: "Employees",
                  description:
                    "Employee profiles with personal details, employment info, documents, and history.",
                },
                {
                  feature: "Recruitment",
                  description:
                    "Job postings, applicant pipeline (applied → screened → interviewed → offered), and hiring.",
                },
                {
                  feature: "Talent Pool",
                  description:
                    "Self-apply form at /talent-pool for unsolicited candidates. Internal review and shortlist workflow.",
                },
                {
                  feature: "Referrals",
                  description:
                    "Employees submit candidate referrals linked to open job postings. Status tracked through to hire.",
                },
                {
                  feature: "Appraisals",
                  description:
                    "Configurable appraisal cycles. Activating a cycle auto-creates appraisals for all active employees.",
                },
                {
                  feature: "Leave",
                  description:
                    "Leave requests, approval workflow, and balance tracking per leave policy.",
                },
                {
                  feature: "Overtime",
                  description:
                    "Overtime requests with rate multipliers snapshotted at approval time.",
                },
              ]}
            />
          </section>

          {/* Accounting */}
          <section id="accounting">
            <SectionHeading icon={BarChart3} title="Accounting" />
            <Prose>
              <p>
                The Accounting module handles all financial records for a
                workspace including revenue, expenses, and assets.
              </p>
            </Prose>
            <FeatureTable
              rows={[
                {
                  feature: "Invoices",
                  description:
                    "Create and manage client invoices with line items, taxes, and PDF export.",
                },
                {
                  feature: "Proforma Invoices",
                  description:
                    "Draft invoices sent before work is complete. Convertible to final invoices.",
                },
                {
                  feature: "Credit Notes",
                  description: "Issue credit notes against existing invoices.",
                },
                {
                  feature: "Expenses",
                  description:
                    "Log business expenses with categories and receipt attachments.",
                },
                {
                  feature: "Tax Profiles",
                  description:
                    "Configure tax rates applied to invoices and expenses.",
                },
                {
                  feature: "Assets",
                  description:
                    "Fixed asset register with purchase value, depreciation, and assignment tracking.",
                },
              ]}
            />
          </section>

          {/* Procurement */}
          <section id="procurement">
            <SectionHeading icon={ShoppingCart} title="Procurement" />
            <Prose>
              <p>
                Manage the full purchase cycle from internal requests through to
                issued purchase orders.
              </p>
            </Prose>
            <FeatureTable
              rows={[
                {
                  feature: "Requisitions",
                  description:
                    "Staff submit purchase requisitions. Managers review and approve before a PO is raised.",
                },
                {
                  feature: "Purchase Orders",
                  description:
                    "Formal POs sent to suppliers. Track status from draft through to received.",
                },
              ]}
            />
          </section>

          {/* Assets */}
          <section id="assets">
            <SectionHeading icon={Package} title="Assets" />
            <Prose>
              <p>
                The Asset register lives under both the Accounting module
                (financial view) and a dedicated Assets section (operational
                view). Assets can be assigned to employees and their condition
                tracked over time.
              </p>
            </Prose>
          </section>

          {/* Operations */}
          <section id="operations">
            <SectionHeading icon={Clock} title="Operations" />
            <Prose>
              <p>
                Configure the rules that govern how time and attendance work
                across your business.
              </p>
            </Prose>
            <FeatureTable
              rows={[
                {
                  feature: "Leave Policies",
                  description:
                    "Define leave types, entitlements, carry-over rules, and applicable employee groups.",
                },
                {
                  feature: "Overtime Rates",
                  description:
                    "Set multipliers for overtime pay. Rates are snapshotted at the time of approval.",
                },
              ]}
            />
          </section>

          {/* Settings */}
          <section id="settings">
            <SectionHeading icon={Settings} title="Settings" />
            <Prose>
              <p>
                Workspace settings are accessible from the sidebar footer. You
                can configure branding, company details, and module-specific
                preferences for each workspace independently.
              </p>
            </Prose>
          </section>
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

function Steps({
  steps,
}: {
  steps: { title: string; description: string }[];
}) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function FeatureTable({
  rows,
}: {
  rows: { feature: string; description: string }[];
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">
              Feature
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/60 last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-2.5 font-medium">{row.feature}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const navSections = [
  {
    title: "Introduction",
    links: [
      { href: "#overview", label: "Overview", icon: Building2 },
      { href: "#getting-started", label: "Getting Started", icon: ChevronRight },
    ],
  },
  {
    title: "Modules",
    links: [
      { href: "#hr", label: "Human Resources", icon: Users },
      { href: "#accounting", label: "Accounting", icon: BarChart3 },
      { href: "#procurement", label: "Procurement", icon: ShoppingCart },
      { href: "#assets", label: "Assets", icon: Package },
      { href: "#operations", label: "Operations", icon: Clock },
      { href: "#settings", label: "Settings", icon: Settings },
    ],
  },
];

const quickLinks = [
  { href: "#hr", label: "Human Resources", icon: Users },
  { href: "#accounting", label: "Accounting", icon: BarChart3 },
  { href: "#procurement", label: "Procurement", icon: ShoppingCart },
  { href: "#operations", label: "Operations", icon: Clock },
];
