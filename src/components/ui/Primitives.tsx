import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-xl text-sm font-bold uppercase tracking-widest transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
      className
    )}
    {...props}
  />
));

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border border-white/5 bg-white/[0.03] text-card-foreground shadow-sm", className)} {...props} />
);

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-md bg-white/5", className)} {...props} />
);
