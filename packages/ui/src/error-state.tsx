import type * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "./alert.js";
import { cn } from "./utils.js";

export interface ErrorStateProps {
  title?: React.ReactNode;
  description: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Error zone: what broke, plus retry/back in `actions`. */
export function ErrorState({ title, description, actions, className }: ErrorStateProps) {
  return (
    <Alert data-slot="error-state" variant="destructive" className={cn(className)}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{description}</AlertDescription>
      {actions ? <div className="flex flex-wrap gap-stack-sm actions-offset">{actions}</div> : null}
    </Alert>
  );
}
