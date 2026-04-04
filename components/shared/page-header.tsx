import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-4">
        <Badge>{eyebrow}</Badge>
        <div className="space-y-3">
          <h1 className="max-w-3xl font-[family:var(--font-display)] text-4xl font-semibold tracking-tight text-[color:var(--foreground)] md:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)] md:text-lg">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
