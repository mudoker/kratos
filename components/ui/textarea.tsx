"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-border bg-foreground/[0.035] px-3 py-2 text-xs text-foreground transition placeholder:text-muted-foreground hover:bg-foreground/[0.055] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/20 focus-visible:bg-card disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
