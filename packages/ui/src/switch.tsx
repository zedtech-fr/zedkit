// Derived from shadcn/ui (switch) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import type * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "./utils.js";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer hit-target inline-flex shrink-0 cursor-pointer items-center rounded-full shadow-sm focus-ring transition-colors disabled:cursor-not-allowed disabled:fade-disabled data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
