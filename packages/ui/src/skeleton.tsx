// Derived from shadcn/ui (skeleton) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import type * as React from "react";

import { cn } from "./utils.js";

type SkeletonProps = React.ComponentProps<"div">;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div data-slot="skeleton" className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)} {...props} />
  );
}

export { Skeleton, type SkeletonProps };
