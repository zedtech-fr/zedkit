// Derived from shadcn/ui (alert) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";

const alertVariants = cva(
  "relative w-full rounded-lg border px-alert-inline py-alert-block text-sm [&>svg]:absolute [&>svg]:top-alert-icon-offset [&>svg]:left-alert-icon-offset [&>svg]:text-foreground [&>svg+div]:-translate-y-alert-icon-nudge [&>svg~*]:pl-alert-content-indent",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/90 text-destructive-foreground dark:border-destructive [&_div]:text-destructive-foreground [&_h2]:text-destructive-foreground [&>svg]:text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  asChild?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  // Children are explicit (not part of the props spread) so the
  // heading-has-content rule can see them; renders identically.
  ({ className, children, ...props }, ref) => (
    <h2 ref={ref} className={cn("mb-1 text-base leading-none font-medium tracking-tight", className)} {...props}>
      {children}
    </h2>
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
