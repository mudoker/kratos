import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlowCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-[32px]", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_36%)] opacity-70 blur-2xl transition duration-300 group-hover:opacity-100" />
      <div className="relative h-full rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)]/90 p-0 backdrop-blur">
        {children}
      </div>
    </div>
  );
}
