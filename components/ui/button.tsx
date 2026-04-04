import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,var(--brand),var(--brand-deep))] text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] hover:opacity-95 [&_svg]:text-white",
        secondary:
          "border border-[color:var(--border)] bg-white/75 text-[color:var(--foreground)] shadow-sm hover:bg-white [&_svg]:text-[color:var(--foreground)]",
        ghost:
          "text-[color:var(--muted-foreground)] hover:bg-white/60 hover:text-[color:var(--foreground)] [&_svg]:text-[color:var(--muted-foreground)]",
        outline:
          "border border-[color:var(--border)] bg-transparent text-[color:var(--foreground)] hover:bg-white/60 [&_svg]:text-[color:var(--foreground)]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);

Button.displayName = "Button";
