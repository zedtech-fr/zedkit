// Derived from shadcn/ui (input) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import type * as React from "react";
import { cn } from "./utils.js";

const inputClassName =
  "flex h-control-height w-full rounded-md border border-input bg-transparent px-3 py-control-block text-control shadow-sm transition-colors file:border-0 file:bg-transparent file:text-control file:font-medium file:text-foreground placeholder:text-muted-foreground focus-ring-control disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive group-data-[invalid=true]/field:border-destructive";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />;
}

export { Input };
