"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ContextAction = {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

type ContextActionMenuProps = {
  actions: ContextAction[];
  children: ReactNode;
  className?: string;
  buttonLabel?: string;
};

export function ContextActionMenu({
  actions,
  children,
  className,
  buttonLabel = "Open actions",
}: ContextActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const openAt = (x: number, y: number) => {
    setPosition({
      x: Math.min(x, window.innerWidth - 180),
      y: Math.min(y, window.innerHeight - 132),
    });
    setOpen(true);
  };

  return (
    <div
      className={cn("relative", className)}
      onContextMenu={(event) => {
        event.preventDefault();
        openAt(event.clientX, event.clientY);
      }}
    >
      {children}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={buttonLabel}
        title={buttonLabel}
        onClick={(event) => {
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          openAt(rect.right - 168, rect.bottom + 6);
        }}
        className="absolute right-3 top-3 h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </Button>

      {open ? (
        <div
          role="menu"
          className="fixed z-50 min-w-40 rounded-xl border border-border bg-card p-1.5 text-foreground shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
          style={{ left: position.x, top: position.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-bold transition disabled:pointer-events-none disabled:opacity-40",
                action.destructive
                  ? "text-[#FF5A5F] hover:bg-[#FF5A5F]/10"
                  : "text-foreground hover:bg-foreground/[0.055]"
              )}
            >
              {action.icon ? <span className="flex h-3.5 w-3.5 items-center justify-center">{action.icon}</span> : null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
