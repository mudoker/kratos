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
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            {label}
          </p>
          <p className="font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--foreground)]">
            {value}
          </p>
        </div>
        {icon}
      </div>
      <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">{detail}</p>
    </Card>
  );
}
