"use client";

import { Loader2 } from "lucide-react";

import { useUiMessages } from "@/components/ui/ui-provider";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  /** Accessible name. Kit `loading` message is the default. */
  label?: string;
  className?: string;
}

/** Named wait indicator. Pair with visible copy that names what is loading. */
export function Spinner({ label, className }: SpinnerProps) {
  const messages = useUiMessages();
  const name = label ?? messages.loading;
  return (
    <span data-slot="spinner" role="status" aria-label={name} className={cn("inline-flex", className)}>
      <Loader2 aria-hidden className="size-icon-sm motion-safe:animate-spin" />
    </span>
  );
}
