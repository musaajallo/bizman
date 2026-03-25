import { auth } from "@/lib/auth";
import Link from "next/link";
import { WebsiteHeader } from "@/components/website/website-header";
import {
  Users,
  BarChart3,
  Package,
  ShoppingCart,
  Clock,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WebsiteHeader isSignedIn={!!session} activePage="home" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <CheckCircle2 className="h-3 w-3" />
          All-in-one business management
        </div>
        <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-[1.12] tracking-tight text-foreground md:text-6xl">
          Run your business from a single platform
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          HR, accounting, procurement, and operations — unified for you and
          managed for your clients.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Read the docs
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold">
            Ready to take control?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sign in to your workspace or create an account to get started.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AfricsCore
          </span>
          <Link
            href="/docs"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Documentation
          </Link>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Users,
    title: "Human Resources",
    description:
      "Employee records, leave management, overtime, payroll, appraisals, and recruitment — all in one place.",
  },
  {
    icon: BarChart3,
    title: "Accounting",
    description:
      "Invoices, expenses, tax profiles, asset tracking, and financial dashboards to keep your books clean.",
  },
  {
    icon: ShoppingCart,
    title: "Procurement",
    description:
      "Purchase requisitions and purchase orders with supplier management and approval workflows.",
  },
  {
    icon: Package,
    title: "Assets",
    description:
      "Track company assets, assign them to employees, and monitor their condition and lifecycle.",
  },
  {
    icon: Clock,
    title: "Operations",
    description:
      "Time-off policies, overtime rules, and schedules configured to match your business processes.",
  },
  {
    icon: Building2,
    title: "Multi-tenant",
    description:
      "Manage your own business as owner while running managed services for multiple client companies.",
  },
];
