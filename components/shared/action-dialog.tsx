"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ActionDialogVariant = "default" | "danger" | "warning";

type ActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon?: ReactNode;
  variant?: ActionDialogVariant;
  cancelLabel?: string;
  actionLabel?: string;
  actionBusyLabel?: string;
  actionDisabled?: boolean;
  busy?: boolean;
  onAction?: () => void;
};

const variantStyles: Record<ActionDialogVariant, { icon: string; action: string }> = {
  default: {
    icon: "bg-foreground/10 text-foreground",
    action: "bg-brand text-background hover:bg-brand-deep",
  },
  danger: {
    icon: "bg-[#FF5A5F]/10 text-[#FF5A5F]",
    action: "bg-[#FF5A5F] text-white hover:bg-[#FF5A5F]/90",
  },
  warning: {
    icon: "bg-[#FFB547]/10 text-[#FFB547]",
    action: "bg-brand text-background hover:bg-brand-deep",
  },
};

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  variant = "default",
  cancelLabel = "Cancel",
  actionLabel = "Continue",
  actionBusyLabel,
  actionDisabled,
  busy,
  onAction,
}: ActionDialogProps) {
  const styles = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-xl border-none bg-card p-5 text-foreground">
        <div className="space-y-3 text-center">
          <div className={cn("mx-auto flex h-10 w-10 items-center justify-center rounded-full", styles.icon)}>
            {icon || <AlertCircle className="h-5 w-5" />}
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-[10px] leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg border-border bg-foreground/[0.035] text-[10px] font-bold"
            >
              {cancelLabel}
            </Button>
            {onAction ? (
              <Button
                size="sm"
                onClick={onAction}
                disabled={busy || actionDisabled}
                className={cn("flex-1 rounded-lg text-[10px] font-bold", styles.action)}
              >
                {busy ? actionBusyLabel || actionLabel : actionLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
