"use client";

import type * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>;

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 border-border",
        orientation === "horizontal" ? "w-full border-t" : "h-full border-l",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
