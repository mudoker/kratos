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
    <Card className="p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)] sm:text-xs sm:tracking-[0.18em]">
            {label}
          </p>
          <p className="font-[family:var(--font-display)] text-lg font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="hidden sm:block">{icon}</div>
      </div>
      <p className="mt-2 line-clamp-1 text-[10px] text-[color:var(--muted-foreground)] sm:mt-4 sm:text-sm">{detail}</p>
    </Card>
  );
}
