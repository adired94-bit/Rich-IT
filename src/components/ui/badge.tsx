import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        primary: "border-primary/30 bg-accent text-accent-foreground",
        success: "border-success/30 bg-success-soft text-success",
        warning: "border-warning/30 bg-warning-soft text-warning",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        info: "border-info/30 bg-info-soft text-info",
        voice: "border-voice/30 bg-voice-soft text-voice",
        outline: "border-border-strong bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
