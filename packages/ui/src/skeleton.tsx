import type * as React from "react";

import { cn } from "./utils.js";

export type SkeletonProps = React.ComponentProps<"div">;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div data-slot="skeleton" className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)} {...props} />
  );
}

export { Skeleton };
