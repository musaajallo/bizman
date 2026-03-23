"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  Building2,
  Hash,
  Receipt,
  Landmark,
  FileText,
  Mail,
  RefreshCw,
  Bell,
  Users,
  Shield,
  Palette,
  SlidersHorizontal,
  Plug,
  MessageCircle,
  Send,
  Bot,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  Server,
} from "lucide-react";

const SETTINGS_NAV = [
  {
    group: "General",
    prefix: "/africs/settings",
    items: [
      { label: "Business Profile", href: "/africs/settings", icon: Building2 },
      { label: "Branding", href: "/africs/settings/branding", icon: Palette },
      { label: "Team", href: "/africs/settings/team", icon: Users },
      { label: "Preferences", href: "/africs/settings/preferences", icon: SlidersHorizontal },
      { label: "Notifications", href: "/africs/settings/notifications", icon: Bell },
      { label: "Security", href: "/africs/settings/security", icon: Shield },
    ],
  },
  {
    group: "Invoicing",
    prefix: "/africs/settings/invoices",
    items: [
      { label: "General", href: "/africs/settings/invoices", icon: Hash },
      { label: "Tax", href: "/africs/settings/invoices/tax", icon: Receipt },
      { label: "Bank Details", href: "/africs/settings/invoices/bank", icon: Landmark },
      { label: "Default Content", href: "/africs/settings/invoices/defaults", icon: FileText },
      { label: "Recurring", href: "/africs/settings/invoices/recurring", icon: RefreshCw },
    ],
  },
  {
    group: "Communications",
    prefix: "/africs/settings/communications",
    items: [
      { label: "Email", href: "/africs/settings/communications/email", icon: Mail },
    ],
  },
  {
    group: "Integrations",
    prefix: "/africs/settings/integrations",
    items: [
      { label: "SMTP", href: "/africs/settings/integrations/smtp", icon: Server },
      { label: "WhatsApp", href: "/africs/settings/integrations/whatsapp", icon: MessageCircle },
      { label: "Resend", href: "/africs/settings/integrations/resend", icon: Send },
      { label: "Claude", href: "/africs/settings/integrations/claude", icon: Bot },
      { label: "Facebook", href: "/africs/settings/integrations/facebook", icon: Facebook },
      { label: "Instagram", href: "/africs/settings/integrations/instagram", icon: Instagram },
      { label: "X", href: "/africs/settings/integrations/x", icon: Twitter },
      { label: "LinkedIn", href: "/africs/settings/integrations/linkedin", icon: Linkedin },
      { label: "YouTube", href: "/africs/settings/integrations/youtube", icon: Youtube },
      { label: "TikTok", href: "/africs/settings/integrations/tiktok", icon: Music },
    ],
  },
];

function isItemActive(href: string, pathname: string) {
  if (href === "/africs/settings") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function isGroupActive(group: typeof SETTINGS_NAV[number], pathname: string) {
  return group.items.some((item) => isItemActive(item.href, pathname));
}

export function SettingsSidebar() {
  const pathname = usePathname();
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const toggle = useCallback((group: string) => {
    setManualOverrides((prev) => {
      const current = prev[group];
      return { ...prev, [group]: current === undefined ? true : !current };
    });
  }, []);

  return (
    <nav className="w-52 shrink-0">
      <div className="space-y-1">
        {SETTINGS_NAV.map((group) => {
          const active = isGroupActive(group, pathname);
          // Default: expand if active, collapse if not. Manual override takes precedence.
          const isOpen = manualOverrides[group.group] !== undefined
            ? !manualOverrides[group.group]
            : active || SETTINGS_NAV.indexOf(group) === 0; // first group open by default

          return (
            <div key={group.group}>
              <button
                type="button"
                onClick={() => toggle(group.group)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] font-semibold uppercase tracking-wider transition-colors select-none",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {group.group}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    !isOpen && "-rotate-90"
                  )}
                />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <ul className="space-y-0.5 mt-0.5 mb-2">
                  {group.items.map((item) => {
                    const itemActive = isItemActive(item.href, pathname);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors",
                            itemActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
