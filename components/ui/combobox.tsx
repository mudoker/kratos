"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No results found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!query) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-9 rounded-lg bg-neutral-100/80 border border-black/[0.04] text-neutral-850 text-xs font-semibold px-3 hover:bg-neutral-200/50"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-black/[0.05] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95">
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-1 h-8 rounded-md bg-neutral-100 border-none px-2.5 focus-visible:ring-0 focus-visible:bg-neutral-100"
            autoFocus
          />
          <ScrollArea className="max-h-[240px]">
            <div className="space-y-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-neutral-100 select-none",
                      value === option.value ? "bg-neutral-100 font-semibold text-neutral-900" : "text-neutral-600 font-medium"
                    )}
                    onClick={() => {
                      onValueChange(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    type="button"
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && <Check className="h-3.5 w-3.5 text-black" />}
                  </button>
                ))
              ) : (
                <div className="px-2.5 py-3 text-center text-xs text-neutral-400">
                  {emptyMessage}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
