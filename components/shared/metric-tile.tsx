import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function MetricTile({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-xl p-2.5 sm:rounded-2xl sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0 space-y-1 sm:space-y-3">
          <p className="truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)] sm:text-xs sm:tracking-[0.18em]">
            {label}
          </p>
          <p className="truncate font-[family:var(--font-display)] text-sm font-semibold leading-tight text-[color:var(--foreground)] sm:text-xl">
            {value}
          </p>
        </div>
        <div className="hidden sm:block">{icon}</div>
      </div>
      <p className="mt-1.5 line-clamp-1 text-[9px] text-[color:var(--muted-foreground)] sm:mt-3 sm:text-xs">{detail}</p>
    </Card>
  );
}
