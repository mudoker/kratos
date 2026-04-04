import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]",
        className
      )}
    >
      {children}
    </span>
  );
}
