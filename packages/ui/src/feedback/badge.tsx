import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border text-caption focus-ring transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary px-badge-inline py-badge-block font-semibold text-primary-foreground shadow hover:badge-primary-hover",
        secondary:
          "border-transparent bg-secondary px-badge-inline py-badge-block font-semibold text-secondary-foreground hover:badge-secondary-hover",
        destructive:
          "border-transparent bg-destructive px-badge-inline py-badge-block font-semibold text-destructive-foreground shadow hover:badge-destructive-hover",
        success:
          "border-transparent bg-success px-badge-inline py-badge-block font-semibold text-success-foreground shadow hover:badge-success-hover",
        warning:
          "border-transparent bg-warning px-badge-inline py-badge-block font-semibold text-warning-foreground shadow hover:badge-warning-hover",
        outline: "px-badge-inline py-badge-block font-semibold text-foreground",
        /** Quiet metadata (a version, a count): caption size, muted, mono tabular numerals, no surface. */
        meta: "rounded-sm border-transparent bg-transparent px-meta flush-block font-mono font-normal text-muted-foreground tabular-nums shadow-none hover:text-foreground",
        "soft-success":
          "border-transparent badge-soft-success px-badge-inline py-badge-block font-semibold text-success",
        "soft-warning":
          "border-transparent badge-soft-warning px-badge-inline py-badge-block font-semibold text-warning-foreground",
        "soft-danger":
          "border-transparent badge-soft-destructive px-badge-inline py-badge-block font-semibold text-destructive",
        "soft-info":
          "border-transparent badge-soft-info px-badge-inline py-badge-block font-semibold text-info",
        "soft-neutral":
          "border-transparent muted-wash px-badge-inline py-badge-block font-semibold text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
