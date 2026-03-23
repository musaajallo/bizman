"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";

interface Props {
  name: string;
  value?: string | null;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({ name, value, placeholder = "Select country…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full h-9 items-center justify-between rounded-md border border-input bg-background px-3 text-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected || placeholder}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <Command>
            <CommandInput placeholder="Search countries…" autoFocus />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              {/* Clear option */}
              <CommandItem
                value="__clear__"
                onSelect={() => { setSelected(""); setOpen(false); }}
                className="text-muted-foreground italic"
              >
                — Clear selection —
              </CommandItem>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={(val) => {
                    setSelected(val);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", selected === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
