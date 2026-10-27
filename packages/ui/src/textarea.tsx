// Derived from shadcn/ui (textarea) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import * as React from "react";

import { cn } from "./utils.js";

const textareaClassName =
  "flex min-h-textarea-min-height w-full rounded-md border border-input bg-transparent px-control-inline py-control-block-lg text-control shadow-sm placeholder:text-muted-foreground focus-ring-control disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive group-data-[invalid=true]/field:border-destructive";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn(textareaClassName, className)} ref={ref} {...props} />;
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
