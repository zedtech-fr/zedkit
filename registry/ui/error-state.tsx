import type * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
      {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
    </Alert>
  );
}
