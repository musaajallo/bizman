"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Building2, Sun, Moon, Search, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "wo", label: "Wolof" },
];

interface WebsiteHeaderProps {
  isSignedIn?: boolean;
  activePage?: "home" | "docs";
}

export function WebsiteHeader({ isSignedIn, activePage }: WebsiteHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState("en");

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">AfricsCore</span>
        </Link>

        {/* Right side */}
        <nav className="flex items-center gap-1">
          <Link
            href="/docs"
            className={`px-3 py-1.5 text-sm transition-colors hover:text-foreground ${
              activePage === "docs"
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Docs
          </Link>

          {/* Search */}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </Button>

          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              id="lang-switcher"
              aria-label="Language"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
            >
              <Globe className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className="flex items-center justify-between"
                >
                  <span>{l.label}</span>
                  {lang === l.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CTA */}
          <div className="ml-2">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
