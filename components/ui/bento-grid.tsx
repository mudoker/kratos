import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

export function BentoGridItem({
  className,
  children,
  span = "default",
}: {
  className?: string;
  children: ReactNode;
  span?: "default" | "wide" | "tall";
}) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-[color:var(--border)] bg-white/60 p-5 shadow-[0_18px_48px_rgba(26,17,13,0.06)] backdrop-blur",
        span === "wide" && "xl:col-span-2",
        span === "tall" && "md:row-span-2",
        className
      )}
    >
      {children}
    </div>
  );
}
