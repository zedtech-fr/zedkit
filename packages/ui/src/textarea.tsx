// Derived from shadcn/ui (textarea) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import type * as React from "react";

import { cn } from "./utils.js";

const textareaClassName =
  "flex min-h-textarea-min-height w-full rounded-md border border-input bg-transparent px-3 py-2 text-control shadow-sm placeholder:text-muted-foreground focus-ring-control disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive group-data-[invalid=true]/field:border-destructive";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(textareaClassName, className)} {...props} />;
}

export { Textarea };
