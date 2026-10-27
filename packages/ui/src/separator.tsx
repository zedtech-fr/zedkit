// Derived from shadcn/ui (separator) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import type * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "./utils.js";

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>;

function Separator({ className, orientation = "horizontal", decorative = true, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-separator-thickness w-full" : "h-full w-separator-thickness",
        className,
      )}
      {...props}
    />
  );
}

export { Separator, type SeparatorProps };
