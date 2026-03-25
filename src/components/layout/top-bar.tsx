"use client";

import { Bell, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <>
      {/* Utility header — always visible */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-border bg-background px-6">
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
              3
            </Badge>
          </Button>
        </div>
      </header>

      {/* Page title — sticky below the utility header */}
      <div className="sticky top-14 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold font-display">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}
