// Derived from shadcn/ui (skeleton) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import { cn } from "./utils.js";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)} {...props} />;
}

export { Skeleton };
