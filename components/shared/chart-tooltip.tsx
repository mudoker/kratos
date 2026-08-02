"use client";

import type { ReactNode } from "react";

type ChartTooltipPayload = {
  name?: string | number;
  value?: string | number;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
  labelFormatter?: (label: string | number | undefined, payload?: ChartTooltipPayload) => ReactNode;
  valueFormatter?: (value: string | number | undefined, payload?: ChartTooltipPayload) => ReactNode;
  valueLabel?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  valueLabel = "Value",
}: ChartTooltipProps) {
  const item = payload?.find((entry) => entry.value !== undefined);

  if (!active || !item) return null;

  const labelContent = labelFormatter ? labelFormatter(label, item) : label;
  const valueContent = valueFormatter ? valueFormatter(item.value, item) : item.value;

  return (
    <div className="min-w-28 rounded-lg border border-border bg-card px-3 py-2 text-foreground shadow-lg">
      {labelContent ? (
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {labelContent}
        </p>
      ) : null}
      <p className="mt-1 text-xs font-semibold text-foreground">
        {valueContent} <span className="font-medium text-muted-foreground">{valueLabel}</span>
      </p>
    </div>
  );
}
