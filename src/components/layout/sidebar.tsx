"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  FolderKanban,
  Calculator,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  Sun,
  Moon,
  Megaphone,
  Share2,
  Mail,
  MessageSquare,
  CalendarDays,
  Zap,
  ClipboardList,
  HandCoins,
  Contact,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  RefreshCcw,
  KeyRound,
  UserCheck,
  UserPlus,
  CalendarOff,
  Award,
  UserRoundPlus,
  Car,
  Wrench,
  Blocks,
  PenTool,
  Sparkles,
  BookOpen,
  Handshake,
  Clock,
  HardHat,
  Headset,
  GanttChart,
  CalendarCheck,
  Truck,
  Wrench as WrenchIcon,
  ClipboardCheck,
  Fuel,
  FileStack,
  BarChart3,
  TrendingUp,
  LineChart,
  IdCard,
  Landmark,
  Network,
  Building,
  Layers,
  Component,
  Globe,
  MapPin,
  UsersRound,
  TruckIcon,
  ShoppingBasket,
  Banknote,
  Wallet,
  Receipt,
  FileInput,
  Timer,
  AlarmClock,
  FileSpreadsheet,
  CreditCard,
  PieChart,
  Scale,
  ShoppingBag,
  MessagesSquare,
  Inbox,
  LayoutGrid,
  Boxes,
  ScrollText,
  FileMinus,
  ArrowUpDown,
  List,
  BookOpenCheck,
  BookMarked,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
  children?: NavItem[];
}

interface Workspace {
  slug: string;
  name: string;
  initials: string;
  isOwner?: boolean;
}

const defaultWorkspace: Workspace = {
  slug: "africs",
  name: "Africs",
  initials: "AF",
  isOwner: true,
};

function getNavItems(workspace: string): NavItem[] {
  if (workspace === "africs") {
    return [
      { label: "Dashboard", href: "/africs", icon: LayoutDashboard, description: "Overview of your business at a glance" },
      {
        label: "Company",
        icon: Landmark,
        description: "Organizational structure and locations",
        children: [
          { label: "Dashboard", href: "/africs/company/dashboard", icon: PieChart, description: "Company structure overview" },
          { label: "Divisions", href: "/africs/company/divisions", icon: Network, description: "Top-level business divisions" },
          { label: "Departments", href: "/africs/company/departments", icon: Building, description: "Departments within divisions" },
          { label: "Units", href: "/africs/company/units", icon: Layers, description: "Operational units within departments" },
          { label: "Sub-Units", href: "/africs/company/sub-units", icon: Component, description: "Specialized teams within units" },
          { label: "Countries", href: "/africs/company/countries", icon: Globe, description: "Countries where you operate" },
          { label: "Locations", href: "/africs/company/locations", icon: MapPin, description: "Offices, branches, and work sites" },
          { label: "Statutory Registers", href: "/africs/company/statutory-registers", icon: Scale, description: "Register of directors and shareholders" },
        ],
      },
      { label: "Projects", href: "/africs/projects", icon: FolderKanban, description: "Track and manage all projects" },
      {
        label: "Accounting",
        icon: Calculator,
        description: "Transactional finance — invoices, bills, payroll, expenses",
        children: [
          { label: "Dashboard", href: "/africs/accounting/dashboard", icon: PieChart, description: "Accounting overview and key metrics" },
          { label: "Invoices", href: "/africs/accounting/invoices", icon: FileSpreadsheet, description: "Create and manage client invoices" },
          { label: "Credit Notes", href: "/africs/accounting/credit-notes", icon: FileMinus, description: "Issue credits against invoices" },
          { label: "Payments", href: "/africs/accounting/payments", icon: CreditCard, description: "Record and track received payments" },
          { label: "Receipts", href: "/africs/accounting/receipts", icon: ScrollText, description: "Payment receipts for paid invoices" },
          { label: "Bills", href: "/africs/accounting/bills", icon: FileInput, description: "Bills you owe to vendors" },
          { label: "Vendors", href: "/africs/accounting/vendors", icon: TruckIcon, description: "Manage your suppliers and vendors" },
          { label: "Expenses", href: "/africs/accounting/expenses", icon: Receipt, description: "Track and approve business expenses" },
          { label: "Payroll", href: "/africs/accounting/payroll", icon: Wallet, description: "Salary processing and compensation" },
          { label: "Procurement", href: "/africs/accounting/procurement", icon: ShoppingBasket, description: "Purchase orders and requisitions" },
          { label: "Loans", href: "/africs/accounting/loans", icon: Banknote, description: "Staff loans, owner loans and salary advances" },
          { label: "Budgets", href: "/africs/accounting/budgets", icon: PieChart, description: "Plan and track spend across departments" },
          { label: "Assets", href: "/africs/accounting/assets", icon: Boxes, description: "Track and manage company assets and equipment" },
          { label: "Chart of Accounts", href: "/africs/accounting/chart-of-accounts", icon: List, description: "Manage your general ledger accounts" },
          { label: "Journal Entries", href: "/africs/accounting/journal-entries", icon: BookOpenCheck, description: "View all posted journal entries" },
          { label: "General Ledger", href: "/africs/accounting/general-ledger", icon: BookMarked, description: "Account-by-account transaction history" },
          { label: "Bank Reconciliation", href: "/africs/accounting/bank-reconciliation", icon: Landmark, description: "Reconcile bank statements with your general ledger" },
          { label: "Accounting Periods", href: "/africs/accounting/periods", icon: CalendarRange, description: "Open, close and lock accounting periods" },
        ],
      },
      {
        label: "Finance",
        icon: TrendingUp,
        description: "Analysis, forecasting, and financial planning",
        children: [
          { label: "Dashboard", href: "/africs/finance/dashboard", icon: PieChart, description: "Financial health — P&L, cash position, KPIs" },
          { label: "P&L", href: "/africs/finance/pl", icon: LineChart, description: "Income statement for any period" },
          { label: "Balance Sheet", href: "/africs/finance/balance-sheet", icon: Scale, description: "Assets, liabilities, and equity snapshot" },
          { label: "Cash Flow", href: "/africs/finance/cash-flow", icon: Banknote, description: "Cash inflows and outflows over time" },
          { label: "Budgets", href: "/africs/finance/budgets", icon: BarChart3, description: "Budget planning and actuals vs. budget" },
          { label: "Forecasting", href: "/africs/finance/forecasting", icon: TrendingUp, description: "Revenue and expense projections" },
        ],
      },
      {
        label: "Human Resources",
        icon: Users,
        description: "People management and HR operations",
        children: [
          { label: "Dashboard", href: "/africs/hr/dashboard", icon: PieChart, description: "HR overview and workforce metrics" },
          { label: "Employees", href: "/africs/hr/employees", icon: UserCheck, description: "Employee profiles and records" },
          { label: "Recruitment", href: "/africs/hr/recruitment", icon: UserPlus, description: "Job postings and hiring pipeline" },
          { label: "Time Off", href: "/africs/hr/time-off", icon: CalendarOff, description: "Leave requests and balances" },
          { label: "Appraisals", href: "/africs/hr/appraisals", icon: Award, description: "Performance reviews and goals" },
          { label: "Timesheets", href: "/africs/hr/timesheets", icon: Timer, description: "Daily attendance and hours logged" },
          { label: "Overtime", href: "/africs/hr/overtime", icon: AlarmClock, description: "Overtime tracking and approvals" },
          { label: "Attendance", href: "/africs/hr/attendance", icon: Clock, description: "Shifts, clock-in records and daily logs" },
          { label: "Benefits", href: "/africs/hr/benefits", icon: HandCoins, description: "Employee benefit types and assignments" },
          { label: "Movements", href: "/africs/hr/movements", icon: ArrowUpDown, description: "Promotions, demotions, transfers and disciplinary" },
          { label: "Talent Pool", href: "/africs/hr/talent-pool", icon: UsersRound, description: "Candidate database and expressions of interest" },
          { label: "Referrals", href: "/africs/hr/referrals", icon: UserRoundPlus, description: "Employee referral programs" },
        ],
      },
      {
        label: "Marketing",
        icon: Megaphone,
        description: "Campaigns, outreach, and engagement",
        children: [
          { label: "Dashboard", href: "/africs/marketing/dashboard", icon: PieChart, description: "Marketing performance overview" },
          { label: "Social Marketing", href: "/africs/marketing/social", icon: Share2, description: "Social media campaigns and scheduling" },
          { label: "Email Marketing", href: "/africs/marketing/email", icon: Mail, description: "Email campaigns and newsletters" },
          { label: "SMS Marketing", href: "/africs/marketing/sms", icon: MessageSquare, description: "SMS campaigns and bulk messaging" },
          { label: "Events", href: "/africs/marketing/events", icon: CalendarDays, description: "Event planning and registrations" },
          { label: "Marketing Automation", href: "/africs/marketing/automation", icon: Zap, description: "Automated workflows and triggers" },
          { label: "Surveys", href: "/africs/marketing/surveys", icon: ClipboardList, description: "Feedback forms and survey results" },
        ],
      },
      {
        label: "CRM",
        icon: Contact,
        description: "Customer relationships and interactions",
        children: [
          { label: "Dashboard", href: "/africs/crm/dashboard", icon: PieChart, description: "CRM overview and client activity" },
          { label: "Clients", href: "/africs/crm/clients", icon: UsersRound, description: "Client directory and profiles" },
          { label: "Appointments", href: "/africs/crm/appointments", icon: CalendarCheck, description: "Schedule and manage meetings" },
        ],
      },
      {
        label: "Sales",
        icon: HandCoins,
        description: "Orders, point-of-sale, and revenue",
        children: [
          { label: "Dashboard", href: "/africs/sales/dashboard", icon: PieChart, description: "Sales performance and pipeline" },
          { label: "Sales", href: "/africs/sales/orders", icon: ShoppingCart, description: "Sales orders and quotes" },
          { label: "POS Shop", href: "/africs/sales/pos-shop", icon: Store, description: "Retail point-of-sale terminal" },
          { label: "POS Restaurant", href: "/africs/sales/pos-restaurant", icon: UtensilsCrossed, description: "Restaurant ordering and billing" },
          { label: "Subscriptions", href: "/africs/sales/subscriptions", icon: RefreshCcw, description: "Recurring subscriptions and renewals" },
          { label: "Rental", href: "/africs/sales/rental", icon: KeyRound, description: "Equipment and asset rentals" },
        ],
      },
      {
        label: "Services",
        icon: Handshake,
        description: "Service delivery and client support",
        children: [
          { label: "Dashboard", href: "/africs/services/dashboard", icon: PieChart, description: "Service operations overview" },
          { label: "Timesheets", href: "/africs/services/timesheets", icon: Clock, description: "Billable hours and utilization" },
          { label: "Field Service", href: "/africs/services/field-service", icon: HardHat, description: "On-site work orders and dispatch" },
          { label: "Helpdesk", href: "/africs/services/helpdesk", icon: Headset, description: "Support tickets and resolution" },
          { label: "Planning", href: "/africs/services/planning", icon: GanttChart, description: "Resource allocation and scheduling" },
        ],
      },
      {
        label: "Fleet",
        icon: Truck,
        description: "Vehicle and fleet operations",
        children: [
          { label: "Dashboard", href: "/africs/fleet/dashboard", icon: PieChart, description: "Fleet status and key metrics" },
          { label: "All Vehicles", href: "/africs/fleet/vehicles", icon: Car, description: "Fleet inventory and vehicle details" },
          { label: "Drivers", href: "/africs/fleet/drivers", icon: IdCard, description: "Driver profiles and assignments" },
          { label: "Maintenance", href: "/africs/fleet/maintenance", icon: WrenchIcon, description: "Service schedules and repairs" },
          { label: "Inspections", href: "/africs/fleet/inspections", icon: ClipboardCheck, description: "Vehicle inspection records" },
          { label: "Fuel Management", href: "/africs/fleet/fuel", icon: Fuel, description: "Fuel consumption and costs" },
          { label: "Documents", href: "/africs/fleet/documents", icon: FileStack, description: "Registration, insurance, and permits" },
          { label: "Utilization", href: "/africs/fleet/utilization", icon: BarChart3, description: "Vehicle usage and efficiency reports" },
        ],
      },
      {
        label: "Communications",
        icon: MessagesSquare,
        description: "Chat, email, and messaging",
        children: [
          { label: "Chat", href: "/africs/communications/chat", icon: MessageSquare, description: "Live chat with clients and team" },
          { label: "Email", href: "/africs/communications/email", icon: Inbox, description: "Email client for sending and receiving" },
        ],
      },
      {
        label: "Store",
        icon: ShoppingBag,
        description: "eCommerce and inventory management",
        children: [
          { label: "eCommerce", href: "/africs/ecommerce", icon: Store, description: "Online store and order management" },
          { label: "Inventory", href: "/africs/inventory", icon: Package, description: "Stock levels and warehouse management" },
        ],
      },
      { label: "Partnerships", href: "/africs/partnerships", icon: Handshake, description: "Joint ventures and strategic partnerships" },
      { label: "Documents", href: "/africs/documents", icon: FileText, description: "Upload and manage files with versioning" },
      {
        label: "Resources",
        icon: BookOpen,
        description: "Knowledge base, support, and quick access",
        children: [
          { label: "Docs", href: "/africs/docs", icon: BookOpen, description: "Internal knowledge base and policies" },
          { label: "Helpdesk", href: "/africs/helpdesk", icon: Headset, description: "Support tickets and issue tracking" },
          { label: "Hub", href: "/africs/hub", icon: LayoutGrid, description: "Quick-launch dashboard for apps and services" },
        ],
      },
      { label: "Settings", href: "/africs/settings", icon: Settings, description: "Business configuration and preferences" },
    ];
  }
  return [
    { label: "Dashboard", href: `/clients/${workspace}/dashboard`, icon: LayoutDashboard },
    { label: "HR & Profiles", href: `/clients/${workspace}/hr`, icon: Users },
    { label: "Forms", href: `/clients/${workspace}/hr/forms`, icon: FileText },
    { label: "Projects", href: `/clients/${workspace}/projects`, icon: FolderKanban },
    { label: "Settings", href: `/clients/${workspace}/settings`, icon: Settings },
  ];
}

function CompanySwitcher({
  active,
  workspaces,
  onSelect,
}: {
  active: Workspace;
  workspaces: Workspace[];
  onSelect: (w: Workspace) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent outline-none">
        <Avatar className="h-8 w-8 rounded-lg bg-primary text-primary-foreground">
          <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            {active.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{active.name}</p>
            <Badge variant="secondary" className="text-[8px] px-1 py-0 font-semibold tracking-wider uppercase shrink-0">Alpha</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {active.isOwner ? "Owner" : "Client"}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.slug}
            onSelect={() => onSelect(ws)}
            className="gap-3 py-2"
          >
            <Avatar className="h-7 w-7 rounded-md bg-secondary">
              <AvatarFallback className="rounded-md text-xs">
                {ws.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{ws.name}</p>
            </div>
            {ws.slug === active.slug && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <Link href="/clients/new">
          <DropdownMenuItem className="gap-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-muted-foreground/40">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Add Company</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({ item, isActive, showTooltip }: { item: NavItem; isActive: boolean; showTooltip?: boolean }) {
  const link = (
    <Link
      href={item.href!}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <item.icon className="relative z-10 h-4 w-4 shrink-0" />
      <span className="relative z-10 truncate">{item.label}</span>
      {item.badge && (
        <Badge
          variant="secondary"
          className="relative z-10 ml-auto text-[10px] px-1.5 py-0"
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );

  if (!showTooltip || !item.description) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={8}>{item.description}</TooltipContent>
    </Tooltip>
  );
}

function NavCategory({
  item,
  pathname,
  showTooltip,
}: {
  item: NavItem;
  pathname: string;
  showTooltip?: boolean;
}) {
  const childActive = item.children?.some(
    (child) =>
      child.href &&
      (pathname === child.href || pathname.startsWith(child.href + "/"))
  );
  const [open, setOpen] = useState(!!childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const categoryButton = (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        childActive
          ? "text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">{item.label}</span>
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
          open && "rotate-90"
        )}
      />
    </button>
  );

  return (
    <div>
      {showTooltip && item.description ? (
        <Tooltip>
          <TooltipTrigger render={categoryButton} />
          <TooltipContent side="right" sideOffset={8}>{item.description}</TooltipContent>
        </Tooltip>
      ) : (
        categoryButton
      )}
      {open && item.children && (
        <div className="ml-4 border-l border-sidebar-border pl-2 mt-0.5 space-y-0.5">
          {item.children.map((child) => {
            const active =
              child.href != null &&
              (pathname === child.href ||
                pathname.startsWith(child.href + "/"));
            return (
              <NavLink key={child.href} item={child} isActive={active} showTooltip={showTooltip} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserSection() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const name = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-3 space-y-1">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 px-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-xs">{theme === "dark" ? "Light" : "Dark"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Sign out</span>
        </Button>
      </div>
    </div>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarTooltips = usePreferencesStore((s) => s.sidebarTooltips);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([defaultWorkspace]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(defaultWorkspace);
  const navItems = getNavItems(activeWorkspace.slug);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data: Workspace[]) => {
        if (data.length > 0) {
          setWorkspaces(data);
          // Match active workspace to current URL
          const slugMatch = pathname.match(/^\/clients\/([^/]+)/);
          if (slugMatch) {
            const found = data.find((w) => w.slug === slugMatch[1]);
            if (found) setActiveWorkspace(found);
          } else if (pathname.startsWith("/africs")) {
            const owner = data.find((w) => w.isOwner);
            if (owner) setActiveWorkspace(owner);
          } else {
            setActiveWorkspace(data[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleWorkspaceSelect = (ws: Workspace) => {
    setActiveWorkspace(ws);
    if (ws.slug === "africs") {
      router.push("/africs");
    } else {
      router.push(`/clients/${ws.slug}/dashboard`);
    }
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Company Switcher */}
      <div className="border-b border-sidebar-border p-3">
        <CompanySwitcher
          active={activeWorkspace}
          workspaces={workspaces}
          onSelect={handleWorkspaceSelect}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="mb-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/dashboard"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Platform Overview
          </Link>
          <Link
            href="/clients"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/clients"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            All Companies
          </Link>
        </div>

        <div className="pt-2">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {activeWorkspace.name}
          </p>
          {navItems.map((item) =>
            item.children ? (
              <NavCategory key={item.label} item={item} pathname={pathname} showTooltip={sidebarTooltips} />
            ) : (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href! || pathname.startsWith(item.href! + "/")}
                showTooltip={sidebarTooltips}
              />
            )
          )}
        </div>

        <div className="pt-2 border-t border-sidebar-border mt-2">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
          <NavCategory
            item={{
              label: "Tools",
              icon: Wrench,
              description: "Utilities and productivity tools",
              children: [
                { label: "Form Builder", href: "/tools/form-builder", icon: Blocks, description: "Design and publish custom forms" },
                { label: "eSign", href: "/tools/sign", icon: PenTool, description: "Electronic signatures for documents" },
                { label: "AI", href: "/tools/ai", icon: Sparkles, description: "AI-powered assistance and automation" },
              ],
            }}
            pathname={pathname}
            showTooltip={sidebarTooltips}
          />
        </div>
      </nav>

      {/* User Section */}
      <UserSection />
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background px-4">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <Image src="/logo.svg" alt="Africs" width={80} height={38} />
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-semibold tracking-wider uppercase">Alpha</Badge>
      </div>
    </>
  );
}
