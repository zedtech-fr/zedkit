import type * as React from "react";

import { Heading } from "./typography.js";
import { Text } from "./typography.js";
import { cn } from "./utils.js";

export interface EmptyStateProps {
  title?: React.ReactNode;
  description: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Empty zone: what it is, plus the next step in `actions`. */
export function EmptyState({ title, description, actions, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center gap-3 py-8 text-center", className)}
    >
      {title ? <Heading level={3}>{title}</Heading> : null}
      <Text variant="muted">{description}</Text>
      {actions ? <div className="flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
