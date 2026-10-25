// Derived from shadcn/ui (input) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import * as React from "react";
import { cn } from "./utils.js";

const inputClassName =
  "flex h-control-height w-full rounded-md border border-input bg-transparent px-control-inline py-control-block text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-ring-control disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input type={type} className={cn(inputClassName, className)} ref={ref} {...props} />
    );
  },
);
Input.displayName = "Input";

export { Input };
