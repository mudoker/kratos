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
    <div className={cn("group relative overflow-hidden rounded-2xl", className)}>
      <div className="relative h-full rounded-2xl border border-black/[0.05] bg-white p-0">
        {children}
      </div>
    </div>
  );
}
