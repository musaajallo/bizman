"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div>
        <h1 className="text-lg font-semibold font-display">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
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
  );
}
