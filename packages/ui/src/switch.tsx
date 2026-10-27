// Derived from shadcn/ui (switch) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "./utils.js";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer hit-target inline-flex h-switch-track-height w-switch-track-width shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm focus-ring transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-switch-thumb rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-switch-travel data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
