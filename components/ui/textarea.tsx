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
      "flex min-h-[80px] w-full rounded-lg border border-black/[0.04] bg-neutral-100/50 hover:bg-neutral-100/85 px-3 py-2 text-xs text-neutral-800 transition placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
