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
        "rounded-2xl border border-black/[0.05] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)]",
        span === "wide" && "xl:col-span-2",
        span === "tall" && "md:row-span-2",
        className
      )}
    >
      {children}
    </div>
  );
}
