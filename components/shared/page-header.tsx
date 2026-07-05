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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <Badge className="text-[9px] font-extrabold tracking-wider">{eyebrow}</Badge>
        <div className="space-y-1.5">
          <h1 className="max-w-3xl font-[family:var(--font-display)] text-2xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-3xl md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-[color:var(--muted-foreground)] sm:text-sm md:text-base">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">{actions}</div> : null}
    </div>
  );
}
