// Derived from shadcn/ui (label) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import type * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
);

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>;

function Label({ className, ...props }: LabelProps) {
  return <LabelPrimitive.Root data-slot="label" className={cn(labelVariants(), className)} {...props} />;
}

export { Label, type LabelProps };
